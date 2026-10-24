import * as THREE from 'three';
import { Chunk } from './Chunk';
import { DataStore } from '../../utils/DataStore';
import { CONFIG } from '../../app/config';

export class World extends THREE.Group {
  asyncLoading = CONFIG.world.asyncLoading;
  drawDistance = CONFIG.world.drawDistance;
  chunkSize = CONFIG.world.chunkSize;
  params = CONFIG.world.params;
  dataStore = new DataStore();
  chunksMap = new Map();

  static chunkKey(x, z) {
    return `${x},${z}`;
  }

  constructor(seed = 0) {
    super();
    this.params.seed = seed;
  }

  /**
   * Regenerate the world data model and the meshes
   */
  generate(clearCache = false) {
    if (clearCache) {
      this.dataStore.clear();
    }
    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }

  /**
   * Updates the visible portions of the world based on the
   * current player position
   * @param {Player} player
   */
  update(player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * Returns an array containing the coordinates of the chunks that
   * are currently visible to the player
   * @param {Player} player
   * @returns {{ x: number, z: number }[]}
   */
  getVisibleChunks(player) {
    const visibleChunks = [];

    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z,
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }
    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks
   * that are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number }[]} visibleChunks
   * @returns {{ x: number, z: number }[]}
   */
  getChunksToAdd(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    return visibleChunks.filter(
      ({ x, z }) => !this.chunksMap.has(World.chunkKey(x, z)),
    );
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number }[]} visibleChunks
   */
  removeUnusedChunks(visibleChunks) {
    const visibleKeys = new Set(
      visibleChunks.map(({ x, z }) => World.chunkKey(x, z)),
    );

    for (const [key, chunk] of this.chunksMap) {
      if (!visibleKeys.has(key)) {
        chunk.disposeInstances();
        this.remove(chunk);
        this.chunksMap.delete(key);
      }
    }
  }

  /**
   * Generates the chunk at the (x,z) coordinates
   * @param {number} x
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new Chunk(this.chunkSize, this, this.dataStore);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };

    this.chunksMap.set(World.chunkKey(x, z), chunk);
    this.add(chunk);

    const onGenerated = () => {
      chunk.generate();
      this.refreshChunkBorders(x, z);
    };

    if (this.asyncLoading) {
      // Load chunk asynchronously
      requestIdleCallback(onGenerated, { timeout: 1000 });
    } else {
      onGenerated();
    }
  }

  refreshChunkBorders(x, z) {
    const worldX = x * this.chunkSize.width;
    const worldZ = z * this.chunkSize.width;

    for (let y = this.chunkSize.minY; y < this.chunkSize.maxY; y++) {
      for (let i = 0; i < this.chunkSize.width; i++) {
        this.hideBlock(worldX, y, worldZ + i);
        this.hideBlock(worldX - 1, y, worldZ + i);
        this.hideBlock(worldX + this.chunkSize.width - 1, y, worldZ + i);
        this.hideBlock(worldX + this.chunkSize.width, y, worldZ + i);

        this.hideBlock(worldX + i, y, worldZ);
        this.hideBlock(worldX + i, y, worldZ - 1);
        this.hideBlock(worldX + i, y, worldZ + this.chunkSize.width - 1);
        this.hideBlock(worldX + i, y, worldZ + this.chunkSize.width);
      }
    }
  }

  /**
   * Resolves the loaded chunk and local block coordinates for a world position.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{ chunk: Chunk, block: { x: number, y: number, z: number } } | null}
   */
  resolveBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (!chunk || !chunk.loaded) return null;

    return { chunk, block: coords.block };
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number, state: {...}} | null}
   */
  getBlock(x, y, z) {
    const resolved = this.resolveBlock(x, y, z);
    if (!resolved) return null;

    return resolved.chunk.getBlock(
      resolved.block.x,
      resolved.block.y,
      resolved.block.z,
    );
  }

  /**
   * Returns the coordinates of the block at (x,y,z)
   *  - `chunk` is the coordinates of the chunk containing the block
   *  - `block` is the coordinates of the block relative to the chunk
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *  chunk: { x: number, z: number },
   *  block: { x: number, y: number, z: number }
   * }}
   */
  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };

    return {
      chunk: chunkCoords,
      block: blockCoords,
    };
  }

  /**
   * Returns the Chunk object at the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {Chunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.chunksMap.get(World.chunkKey(chunkX, chunkZ));
  }

  disposeChunks() {
    for (const chunk of this.chunksMap.values()) {
      chunk.disposeInstances();
    }
    this.chunksMap.clear();
    this.clear();
  }

  /**
   * Adds a new block at (x, y, z) of type `blockId`
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x, y, z, block) {
    const resolved = this.resolveBlock(x, y, z);
    if (!resolved) return;

    resolved.chunk.addBlock(
      resolved.block.x,
      resolved.block.y,
      resolved.block.z,
      block,
    );

    // Hide adjacent neighbours if they are now hidden
    this.hideBlock(x - 1, y, z);
    this.hideBlock(x + 1, y, z);
    this.hideBlock(x, y - 1, z);
    this.hideBlock(x, y + 1, z);
    this.hideBlock(x, y, z - 1);
    this.hideBlock(x, y, z + 1);
  }

  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const resolved = this.resolveBlock(x, y, z);
    if (!resolved) return;

    resolved.chunk.removeBlock(
      resolved.block.x,
      resolved.block.y,
      resolved.block.z,
    );

    // Reveal adjacent neighbours if they are hidden
    this.revealBlock(x - 1, y, z);
    this.revealBlock(x + 1, y, z);
    this.revealBlock(x, y - 1, z);
    this.revealBlock(x, y + 1, z);
    this.revealBlock(x, y, z - 1);
    this.revealBlock(x, y, z + 1);
  }

  /**
   * Reveals the block at (x, y, z) by adding a new mesh instance
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  revealBlock(x, y, z) {
    const resolved = this.resolveBlock(x, y, z);
    if (!resolved) return;

    resolved.chunk.addBlockInstance(
      resolved.block.x,
      resolved.block.y,
      resolved.block.z,
    );
  }

  /**
   * Hides the block at (x, y, z) by removing the mesh instance
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  hideBlock(x, y, z) {
    const resolved = this.resolveBlock(x, y, z);
    if (!resolved) return;

    if (
      resolved.chunk.isBlockObscured(
        resolved.block.x,
        resolved.block.y,
        resolved.block.z,
      )
    ) {
      resolved.chunk.deleteBlockInstance(
        resolved.block.x,
        resolved.block.y,
        resolved.block.z,
      );
    }
  }
}
