import { CONFIG } from '../../app/Config';
import { DataStore } from '../persistence/DataStore';
import {
  ChunkData,
  EMPTY_ID,
  packEdit,
  UNLOADED,
  unpackEdit,
} from './ChunkData';
import {
  blockIndex,
  chunkPos,
  indexToLocal,
  inYRange,
  worldToChunkAxis,
  worldToLocalAxis,
} from './Coords';
import { generateChunkData } from './WorldGenerator';
import { blocksById } from '../../objects/blocks/BlocksRegistry';
import { Block } from '../blocks/BlockParams';
import { CHUNK_WIDTH } from './Constants';

interface ChunkRecord {
  x: number;
  z: number;
  data: ChunkData;
  loaded: boolean;
}

export interface WorldListener {
  chunkChanged(x: number, z: number, urgent: boolean): void;
  chunkUnloaded(x: number, z: number): void;
}

const keyOf = (x: number, z: number) => `${x},${z}`;
const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export class World {
  asyncLoading = CONFIG.world.asyncLoading;
  drawDistance = CONFIG.world.drawDistance;
  params = CONFIG.world.params;
  dataStore = new DataStore();
  listener: WorldListener | null = null;
  centreX = 0;
  centreZ = 0;
  private chunks = new Map<string, ChunkRecord>();

  constructor(seed = 0) {
    this.params.seed = seed;
  }

  /**
   * Regenerate the world data model and the meshes
   * @param {boolean} clearCache
   */
  generate(clearCache = false) {
    if (clearCache) this.dataStore.clear();
    this.unloadAll();
    const d = this.drawDistance;
    for (let x = -d; x <= d; x++) {
      for (let z = -d; z <= d; z++) this.loadChunk(x, z);
    }
  }

  /**
   * Updates the visible portions of the world based on the
   * current player position
   * @param {{ position: { x: number; z: number } }} player
   */
  update(player: { position: { x: number; z: number } }) {
    this.centreX = worldToChunkAxis(Math.round(player.position.x));
    this.centreZ = worldToChunkAxis(Math.round(player.position.z));
    const d = this.drawDistance;

    for (const chunk of this.chunks.values()) {
      if (
        Math.abs(chunk.x - this.centreX) > d ||
        Math.abs(chunk.z - this.centreZ) > d
      ) {
        this.unload(chunk);
      }
    }
    for (let x = this.centreX - d; x <= this.centreX + d; x++) {
      for (let z = this.centreZ - d; z <= this.centreZ + d; z++) {
        if (!this.chunks.has(keyOf(x, z))) this.loadChunk(x, z);
      }
    }
  }

  // --- reading ---

  /**
   * Block id at integer world block coordinates (x, y, z)
   *  - EMPTY_ID above and below the world
   *  - UNLOADED if the chunk is missing or still generating
   */
  getBlockId(x: number, y: number, z: number): number {
    if (!inYRange(y)) return EMPTY_ID;
    const r = this.resolve(x, z);
    return r ? r.chunk.data.getId(r.lx, y, r.lz) : UNLOADED;
  }

  getBlockState(x: number, y: number, z: number): number {
    if (!inYRange(y)) return 0;
    const r = this.resolve(x, z);
    return r ? r.chunk.data.getState(r.lx, y, r.lz) : 0;
  }

  /** True if the chunk containing the continuous position (x, z) has finished generating */
  isLoadedAt(x: number, z: number) {
    return this.resolve(Math.round(x), Math.round(z)) !== null;
  }

  /** Data of a loaded chunk, or null. Used by the renderer to build mesh input. */
  getChunkData(chunkX: number, chunkZ: number): ChunkData | null {
    const chunk = this.chunks.get(keyOf(chunkX, chunkZ));
    return chunk?.loaded ? chunk.data : null;
  }

  // --- editing ---

  /**
   * Adds a new block at (x, y, z) of type `blockId`
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x: number, y: number, z: number, block: Block, state = 0) {
    if (this.getBlockId(x, y, z) !== EMPTY_ID) return;
    this.setBlock(x, y, z, block.id, state);
  }

  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x: number, y: number, z: number) {
    const id = this.getBlockId(x, y, z);
    if (id === EMPTY_ID || id === UNLOADED) return;
    this.setBlock(x, y, z, EMPTY_ID, 0);
  }

  private setBlock(x: number, y: number, z: number, id: number, state: number) {
    const r = this.resolve(x, z);
    if (!r || !inYRange(y)) return;

    r.chunk.data.set(r.lx, y, r.lz, id, state);
    this.dataStore.set(
      r.chunk.x,
      r.chunk.z,
      blockIndex(r.lx, y, r.lz),
      packEdit(id, state),
    );

    // This chunk, plus any neighbour whose border face just changed
    const { x: cx, z: cz } = r.chunk;
    this.notify(cx, cz, true);
    if (r.lx === 0) this.notify(cx - 1, cz, true);
    if (r.lx === CHUNK_WIDTH - 1) this.notify(cx + 1, cz, true);
    if (r.lz === 0) this.notify(cx, cz - 1, true);
    if (r.lz === CHUNK_WIDTH - 1) this.notify(cx, cz + 1, true);
  }

  // --- chunk lifecycle ---

  private loadChunk(x: number, z: number) {
    const chunk: ChunkRecord = { x, z, data: new ChunkData(), loaded: false };
    this.chunks.set(keyOf(x, z), chunk);

    const finish = () => {
      // Unloaded or regenerated while we were waiting
      if (this.chunks.get(keyOf(x, z)) !== chunk) return;

      chunk.data = generateChunkData(this.params, chunkPos(x, z));
      this.applySavedEdits(chunk);
      chunk.loaded = true;

      // New data changes this mesh and the border faces of loaded neighbours
      this.notify(x, z, false);
      for (const [dx, dz] of NEIGHBOURS) this.notify(x + dx, z + dz, false);
    };

    if (this.asyncLoading) requestIdleCallback(finish, { timeout: 1000 });
    else finish();
  }

  private applySavedEdits(chunk: ChunkRecord) {
    const edits = this.dataStore.chunkEdits(chunk.x, chunk.z);
    if (!edits) return;
    for (const [index, value] of edits) {
      const { id, state } = unpackEdit(value);
      if (!blocksById.has(id)) continue;
      const { x, y, z } = indexToLocal(index);
      chunk.data.set(x, y, z, id, state);
    }
  }

  private unload(chunk: ChunkRecord) {
    this.chunks.delete(keyOf(chunk.x, chunk.z));
    this.listener?.chunkUnloaded(chunk.x, chunk.z);
  }

  private unloadAll() {
    for (const chunk of [...this.chunks.values()]) this.unload(chunk);
  }

  // --- helpers ---

  private resolve(x: number, z: number) {
    const chunk = this.chunks.get(
      keyOf(worldToChunkAxis(x), worldToChunkAxis(z)),
    );
    if (!chunk?.loaded) return null;
    return { chunk, lx: worldToLocalAxis(x), lz: worldToLocalAxis(z) };
  }

  /** Only loaded chunks have a mesh to refresh */
  private notify(cx: number, cz: number, urgent: boolean) {
    if (this.chunks.get(keyOf(cx, cz))?.loaded) {
      this.listener?.chunkChanged(cx, cz, urgent);
    }
  }
}
