// scripts/engine/world/coords.ts
import { CHUNK_HEIGHT, CHUNK_WIDTH, MAX_Y, MIN_Y } from './constants';

export type BlockPos = { x: number; y: number; z: number } & {
  readonly __brand: unique symbol;
};
export type ChunkPos = { x: number; z: number } & {
  readonly __brand: unique symbol;
};
export type LocalPos = { x: number; y: number; z: number } & {
  readonly __brand: unique symbol;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

export const worldToChunkAxis = (n: number) => Math.floor(n / CHUNK_WIDTH);
export const worldToLocalAxis = (n: number) => mod(n, CHUNK_WIDTH);

export const blockPos = (x: number, y: number, z: number) =>
  ({ x, y, z }) as BlockPos;
export const chunkPos = (x: number, z: number) => ({ x, z }) as ChunkPos;
export const localPos = (x: number, y: number, z: number) =>
  ({ x, y, z }) as LocalPos;

export const worldToBlock = (x: number, y: number, z: number): BlockPos =>
  blockPos(Math.round(x) + 0, Math.round(y) + 0, Math.round(z) + 0);

export const toChunkPos = (b: BlockPos): ChunkPos =>
  chunkPos(worldToChunkAxis(b.x), worldToChunkAxis(b.z));

export const toLocalPos = (b: BlockPos): LocalPos =>
  localPos(worldToLocalAxis(b.x), b.y, worldToLocalAxis(b.z));

export const toBlockPos = (c: ChunkPos, l: LocalPos): BlockPos =>
  blockPos(c.x * CHUNK_WIDTH + l.x, l.y, c.z * CHUNK_WIDTH + l.z);

export const chunkKey = (c: ChunkPos) => `${c.x},${c.z}`;

export const inYRange = (y: number) => y >= MIN_Y && y < MAX_Y;

export const blockIndex = (x: number, y: number, z: number) =>
  (x * CHUNK_HEIGHT + (y - MIN_Y)) * CHUNK_WIDTH + z;

export const indexToLocal = (i: number): LocalPos => {
  const z = i % CHUNK_WIDTH;
  const rest = (i - z) / CHUNK_WIDTH;
  const yOffset = rest % CHUNK_HEIGHT;
  const x = (rest - yOffset) / CHUNK_HEIGHT;
  return localPos(x, yOffset + MIN_Y, z);
};

export const inLocalBounds = (x: number, y: number, z: number) =>
  x >= 0 && x < CHUNK_WIDTH && z >= 0 && z < CHUNK_WIDTH && inYRange(y);
