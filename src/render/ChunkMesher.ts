import { CHUNK_WIDTH as W, MAX_Y, MIN_Y } from '../engine/world/Constants';
import { blockIndex } from '../engine/world/Coords';
import { FACE_NORMALS, NO_CULL } from './models/Faces';

export const Layer = { NONE: 0, OPAQUE: 1, CUTOUT: 2, TRANSPARENT: 3 } as const;

/** All arrays indexed by block id, except faceMaterial (id * 6 + face) */
export interface MeshTables {
  layer: Uint8Array;
  opaque: Uint8Array; // 1 = hides neighbouring faces
  cullSame: Uint8Array; // 1 = hide faces between two blocks of the same id
  material: Uint8Array; // slot in the shared material array
  stateCount: Uint8Array;
  modelBase: Uint32Array; // first model index; model index = modelBase + state
  tint: Float32Array; // rgb x 3 per id, linear
  quadStart: Uint32Array;
  quadCount: Uint8Array;
  quadPos: Float32Array; // 12 floats (4 verts)
  quadNormal: Float32Array; // 3
  quadUv: Float32Array; // 8, already in atlas space
  quadCull: Uint8Array;
}

export interface MeshLayer {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  groups: MeshGroup[];
}

export interface MeshInput {
  ids: Uint16Array;
  states: Uint8Array;
  /** Border columns of neighbour chunks, null if not loaded.
   *  Index: (y - MIN_Y) * W + i, i = z for px/nx, x for pz/nz. */
  borders: {
    px: Uint16Array | null; // chunk x+1, its column x=0
    nx: Uint16Array | null; // chunk x-1, its column x=15
    pz: Uint16Array | null; // chunk z+1, its row z=0
    nz: Uint16Array | null; // chunk z-1, its row z=15
  };
}

export interface MeshGroup {
  start: number;
  count: number;
  material: number;
}

export interface ChunkMeshData {
  opaque: MeshLayer;
  cutout: MeshLayer;
  transparent: MeshLayer;
}

function idAt(input: MeshInput, x: number, y: number, z: number): number {
  if (y < MIN_Y || y >= MAX_Y) return 0;
  if (x >= 0 && x < W && z >= 0 && z < W) return input.ids[blockIndex(x, y, z)];
  const row = (y - MIN_Y) * W;
  if (x === W) return input.borders.px?.[row + z] ?? 0;
  if (x === -1) return input.borders.nx?.[row + z] ?? 0;
  if (z === W) return input.borders.pz?.[row + x] ?? 0;
  if (z === -1) return input.borders.nz?.[row + x] ?? 0;
  return 0;
}

class LayerBuilder {
  private byMaterial = new Map<
    number,
    { p: number[]; n: number[]; uv: number[]; c: number[]; i: number[] }
  >();

  addQuad(
    material: number,
    t: MeshTables,
    q: number,
    x: number,
    y: number,
    z: number,
    rgb: Float32Array,
    c3: number,
  ) {
    let b = this.byMaterial.get(material);
    if (!b)
      this.byMaterial.set(
        material,
        (b = { p: [], n: [], uv: [], c: [], i: [] }),
      );
    const base = b.p.length / 3;
    for (let k = 0; k < 4; k++) {
      const p = q * 12 + k * 3;
      b.p.push(x + t.quadPos[p], y + t.quadPos[p + 1], z + t.quadPos[p + 2]);
      b.n.push(
        t.quadNormal[q * 3],
        t.quadNormal[q * 3 + 1],
        t.quadNormal[q * 3 + 2],
      );
      b.uv.push(t.quadUv[q * 8 + k * 2], t.quadUv[q * 8 + k * 2 + 1]);
      b.c.push(rgb[c3], rgb[c3 + 1], rgb[c3 + 2]);
    }
    b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  finish(): MeshLayer {
    let verts = 0,
      idx = 0;
    for (const b of this.byMaterial.values()) {
      verts += b.p.length / 3;
      idx += b.i.length;
    }
    const out: MeshLayer = {
      positions: new Float32Array(verts * 3),
      normals: new Float32Array(verts * 3),
      uvs: new Float32Array(verts * 2),
      colors: new Float32Array(verts * 3),
      indices: new Uint32Array(idx),
      groups: [],
    };
    let vBase = 0,
      iOff = 0;
    for (const [material, b] of this.byMaterial) {
      out.positions.set(b.p, vBase * 3);
      out.normals.set(b.n, vBase * 3);
      out.uvs.set(b.uv, vBase * 2);
      out.colors.set(b.c, vBase * 3);
      for (let j = 0; j < b.i.length; j++)
        out.indices[iOff + j] = b.i[j] + vBase;
      out.groups.push({ start: iOff, count: b.i.length, material });
      vBase += b.p.length / 3;
      iOff += b.i.length;
    }
    return out;
  }
}

const isHidden = (t: MeshTables, id: number, nid: number) =>
  t.opaque[nid] === 1 || (t.cullSame[id] === 1 && nid === id);

export function meshChunk(input: MeshInput, t: MeshTables): ChunkMeshData {
  const builders = [
    null,
    new LayerBuilder(),
    new LayerBuilder(),
    new LayerBuilder(),
  ];
  for (let x = 0; x < W; x++) {
    for (let y = MIN_Y; y < MAX_Y; y++) {
      for (let z = 0; z < W; z++) {
        const i = blockIndex(x, y, z);
        const id = input.ids[i];
        const layer = t.layer[id];
        if (layer === Layer.NONE) continue;

        const model =
          t.modelBase[id] + Math.min(input.states[i], t.stateCount[id] - 1);
        const first = t.quadStart[model];
        const last = first + t.quadCount[model];
        const material = t.material[id];

        for (let q = first; q < last; q++) {
          const cull = t.quadCull[q];
          if (cull !== NO_CULL) {
            if (cull === 3 && y === MIN_Y) continue; // underside of world
            const [dx, dy, dz] = FACE_NORMALS[cull];
            if (isHidden(t, id, idAt(input, x + dx, y + dy, z + dz))) continue;
          }
          builders[layer]!.addQuad(material, t, q, x, y, z, t.tint, id * 3);
        }
      }
    }
  }
  return {
    opaque: builders[1]!.finish(),
    cutout: builders[2]!.finish(),
    transparent: builders[3]!.finish(),
  };
}
