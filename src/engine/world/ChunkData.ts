import { CHUNK_VOLUME } from './Constants';
import { blockIndex } from './Coords';

export const EMPTY_ID = 0;
export const UNLOADED = -1;

export const packEdit = (id: number, state: number): number =>
  (state << 16) | id;
export const unpackEdit = (value: number): { id: number; state: number } => ({
  id: value & 0xffff,
  state: value >>> 16,
});

export class ChunkData {
  readonly ids = new Uint16Array(CHUNK_VOLUME);
  readonly states = new Uint8Array(CHUNK_VOLUME);

  getId(x: number, y: number, z: number): number {
    return this.ids[blockIndex(x, y, z)];
  }

  getState(x: number, y: number, z: number): number {
    return this.states[blockIndex(x, y, z)];
  }

  set(x: number, y: number, z: number, id: number, state = 0): void {
    const index = blockIndex(x, y, z);
    this.ids[index] = id;
    this.states[index] = state;
  }

  clear(): void {
    this.ids.fill(EMPTY_ID);
    this.states.fill(0);
  }
}
