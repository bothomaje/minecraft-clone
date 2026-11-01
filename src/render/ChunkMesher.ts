import { CHUNK_WIDTH as W, MAX_Y, MIN_Y } from '../engine/world/Constants';
import { blockIndex } from '../engine/world/Coords';

export const Layer = { NONE: 0, OPAQUE: 1, CUTOUT: 2, TRANSPARENT: 3 } as const;

/** All arrays indexed by block id, except faceMaterial (id * 6 + face) */
export interface MeshTables {
  layer: Uint8Array;
  opaque: Uint8Array; // 1 = hides neighbouring faces
  cullSame: Uint8Array; // 1 = hide faces between two blocks of the same id
  hasAxis: Uint8Array; // 1 = state 0/1/2 means axis y/x/z
  faceMaterial: Uint16Array;
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
export interface MeshLayer {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  groups: MeshGroup[];
}
export interface ChunkMeshData {
  opaque: MeshLayer;
  cutout: MeshLayer;
  transparent: MeshLayer;
}

// Order matches THREE.BoxGeometry. Corners are CCW seen from outside: BL, BR, TR, TL.
const FACES = [
  {
    n: [1, 0, 0],
    v: [
      [0.5, -0.5, 0.5],
      [0.5, -0.5, -0.5],
      [0.5, 0.5, -0.5],
      [0.5, 0.5, 0.5],
    ],
  },
  {
    n: [-1, 0, 0],
    v: [
      [-0.5, -0.5, -0.5],
      [-0.5, -0.5, 0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
    ],
  },
  {
    n: [0, 1, 0],
    v: [
      [-0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, -0.5],
    ],
  },
  {
    n: [0, -1, 0],
    v: [
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5],
      [0.5, -0.5, 0.5],
      [-0.5, -0.5, 0.5],
    ],
  },
  {
    n: [0, 0, 1],
    v: [
      [-0.5, -0.5, 0.5],
      [0.5, -0.5, 0.5],
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5],
    ],
  },
  {
    n: [0, 0, -1],
    v: [
      [0.5, -0.5, -0.5],
      [-0.5, -0.5, -0.5],
      [-0.5, 0.5, -0.5],
      [0.5, 0.5, -0.5],
    ],
  },
] as const;
const QUAD_UV = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;

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

const isHidden = (t: MeshTables, id: number, nid: number) =>
  t.opaque[nid] === 1 || (t.cullSame[id] === 1 && nid === id);

/** Logs: state 1 = x axis (end faces 0,1), 2 = z axis (end faces 4,5) */
function isEndFace(t: MeshTables, id: number, face: number, state: number) {
  if (!t.hasAxis[id] || state === 0) return null; // null = not axis-rotated
  const end = state === 1 ? 0 : 4;
  return face === end || face === end + 1;
}

function materialFor(t: MeshTables, id: number, face: number, state: number) {
  const end = isEndFace(t, id, face, state);
  if (end === null) return t.faceMaterial[id * 6 + face];
  // faces 2/3 = top/bottom material, face 0 = side material
  return t.faceMaterial[id * 6 + (end ? (face % 2 === 0 ? 2 : 3) : 0)];
}

// Whole cube was rotated before, so side textures turned with it. Verify direction vs old renderer.
const uvShift = (t: MeshTables, id: number, face: number, state: number) =>
  isEndFace(t, id, face, state) === false ? 1 : 0;

class LayerBuilder {
  private byMaterial = new Map<
    number,
    { p: number[]; n: number[]; uv: number[]; i: number[] }
  >();

  addQuad(
    material: number,
    x: number,
    y: number,
    z: number,
    face: number,
    shift: number,
  ) {
    let b = this.byMaterial.get(material);
    if (!b)
      this.byMaterial.set(material, (b = { p: [], n: [], uv: [], i: [] }));
    const base = b.p.length / 3;
    const { n, v } = FACES[face];
    for (let k = 0; k < 4; k++) {
      b.p.push(x + v[k][0], y + v[k][1], z + v[k][2]);
      b.n.push(n[0], n[1], n[2]);
      b.uv.push(...QUAD_UV[(k + shift) % 4]);
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
      indices: new Uint32Array(idx),
      groups: [],
    };
    let vBase = 0,
      iOff = 0;
    for (const [material, b] of this.byMaterial) {
      out.positions.set(b.p, vBase * 3);
      out.normals.set(b.n, vBase * 3);
      out.uvs.set(b.uv, vBase * 2);
      for (let j = 0; j < b.i.length; j++)
        out.indices[iOff + j] = b.i[j] + vBase;
      out.groups.push({ start: iOff, count: b.i.length, material });
      vBase += b.p.length / 3;
      iOff += b.i.length;
    }
    return out;
  }
}

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
        const state = input.states[i];
        for (let f = 0; f < 6; f++) {
          if (f === 3 && y === MIN_Y) continue; // underside of world
          const [dx, dy, dz] = FACES[f].n;
          if (isHidden(t, id, idAt(input, x + dx, y + dy, z + dz))) continue;
          builders[layer]!.addQuad(
            materialFor(t, id, f, state),
            x,
            y,
            z,
            f,
            uvShift(t, id, f, state),
          );
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
