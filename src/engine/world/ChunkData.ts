import { CHUNK_VOLUME } from './constants';
import { blockIndex } from './coords';

export const EMPTY_ID = 0;
export const UNLOADED = -1;

export class ChunkData {
  readonly ids = new Uint16Array(CHUNK_VOLUME);

  get(x: number, y: number, z: number): number {
    return this.ids[blockIndex(x, y, z)];
  }

  set(x: number, y: number, z: number, id: number): void {
    this.ids[blockIndex(x, y, z)] = id;
  }

  clear(): void {
    this.ids.fill(EMPTY_ID);
  }
}
