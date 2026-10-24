import { chunkKey, ChunkPos } from '../world/coords';

export type SavedEdits = { chunks: Record<string, Record<string, number>> };

export class DataStore {
  private chunks = new Map<string, Map<number, number>>();

  set(chunkX: number, chunkZ: number, index: number, id: number): void {
    const key = chunkKey({ x: chunkX, z: chunkZ } as ChunkPos);
    let edits = this.chunks.get(key);
    if (!edits) {
      edits = new Map();
      this.chunks.set(key, edits);
    }
    edits.set(index, id);
  }

  chunkEdits(
    chunkX: number,
    chunkZ: number,
  ): ReadonlyMap<number, number> | undefined {
    return this.chunks.get(chunkKey({ x: chunkX, z: chunkZ } as ChunkPos));
  }

  clear(): void {
    this.chunks.clear();
  }

  serialize(): SavedEdits {
    const chunks: SavedEdits['chunks'] = {};
    for (const [key, edits] of this.chunks) {
      chunks[key] = Object.fromEntries(edits);
    }
    return { chunks };
  }

  restore(raw: SavedEdits): boolean {
    this.chunks.clear();
    for (const [key, edits] of Object.entries(raw.chunks)) {
      const map = new Map<number, number>();
      for (const [index, id] of Object.entries(edits))
        map.set(Number(index), id);
      this.chunks.set(key, map);
    }
    return true;
  }
}
