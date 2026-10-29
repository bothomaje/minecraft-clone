import { ChunkData } from '../engine/world/ChunkData';
import {
  CHUNK_HEIGHT,
  CHUNK_WIDTH as W,
  MIN_Y,
} from '../engine/world/Constants';
import { World } from '../engine/world/World';
import { MeshInput } from './ChunkMesher';

function column(data: ChunkData | null, axis: 'x' | 'z', fixed: number) {
  if (!data) return null;
  const out = new Uint16Array(CHUNK_HEIGHT * W);
  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    for (let i = 0; i < W; i++) {
      out[y * W + i] =
        axis === 'x'
          ? data.getId(fixed, y + MIN_Y, i)
          : data.getId(i, y + MIN_Y, fixed);
    }
  }
  return out;
}

export function buildMeshInput(
  world: World,
  cx: number,
  cz: number,
  copy = false, // true when the buffers will be transferred to a worker
): MeshInput | null {
  const data = world.getChunkData(cx, cz);
  if (!data) return null;
  return {
    ids: copy ? data.ids.slice() : data.ids,
    states: copy ? data.states.slice() : data.states,
    borders: {
      px: column(world.getChunkData(cx + 1, cz), 'x', 0),
      nx: column(world.getChunkData(cx - 1, cz), 'x', W - 1),
      pz: column(world.getChunkData(cx, cz + 1), 'z', 0),
      nz: column(world.getChunkData(cx, cz - 1), 'z', W - 1),
    },
  };
}
