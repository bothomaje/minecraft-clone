import * as THREE from 'three';
import { Block, blockParams } from '../engine/blocks/BlockParams';
import { TextureAtlas } from './atlas/TextureAtlas';
import { Layer, MeshTables } from './ChunkMesher';
import { blockRender } from './models/BlockRender';
import { rotateModel, shapes } from './models/Shapes';

const LAYER = {
  opaque: Layer.OPAQUE,
  cutout: Layer.CUTOUT,
  transparent: Layer.TRANSPARENT,
} as const;
const SLOT = { opaque: 0, cutout: 1, transparent: 2 } as const;
const UNIT_UV = [0, 0, 1, 0, 1, 1, 0, 1];

export function bakeMeshTables(atlas: TextureAtlas): MeshTables {
  const entries = Object.entries(blockParams) as [string, Block][];
  const size = Math.max(...entries.map(([, b]) => b.id)) + 1;

  const layer = new Uint8Array(size);
  const opaque = new Uint8Array(size);
  const cullSame = new Uint8Array(size);
  const material = new Uint8Array(size);
  const stateCount = new Uint8Array(size).fill(1);
  const modelBase = new Uint32Array(size);
  const tint = new Float32Array(size * 3).fill(1);

  const quadStart: number[] = [];
  const quadCount: number[] = [];
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const cull: number[] = [];
  let quads = 0;
  let models = 0;

  for (const [key, b] of entries) {
    if (b.id === 0) continue;
    const def = blockRender[key];
    if (!def) throw new Error(`No render definition for block "${key}"`);

    layer[b.id] = LAYER[def.layer];
    opaque[b.id] = b.opaque ? 1 : 0;
    cullSame[b.id] = (def.cullSame ?? def.layer === 'transparent') ? 1 : 0;
    material[b.id] = SLOT[def.layer];
    if (def.tint !== undefined) {
      const c = new THREE.Color(def.tint); // converts to linear working space
      tint.set([c.r, c.g, c.b], b.id * 3);
    }

    // One baked model per possible state value
    const base = shapes[def.model](def.textures);
    const states =
      def.rotation === 'axis' ? 3 : def.rotation === 'facing' ? 4 : 1;
    stateCount[b.id] = states;
    modelBase[b.id] = models;

    for (let s = 0; s < states; s++) {
      const model = rotateModel(base, def.rotation, s);
      quadStart.push(quads);
      quadCount.push(model.length);
      models++;
      for (const quad of model) {
        for (const v of quad.vertices) pos.push(v[0], v[1], v[2]);
        nrm.push(quad.normal[0], quad.normal[1], quad.normal[2]);
        const r = atlas.region(quad.texture);
        const local = quad.uv ?? UNIT_UV;
        for (let k = 0; k < 4; k++) {
          uv.push(
            r.u0 + (r.u1 - r.u0) * local[k * 2],
            r.v0 + (r.v1 - r.v0) * local[k * 2 + 1],
          );
        }
        cull.push(quad.cull);
        quads++;
      }
    }
  }

  return {
    layer,
    opaque,
    cullSame,
    material,
    stateCount,
    modelBase,
    tint,
    quadStart: Uint32Array.from(quadStart),
    quadCount: Uint8Array.from(quadCount),
    quadPos: Float32Array.from(pos),
    quadNormal: Float32Array.from(nrm),
    quadUv: Float32Array.from(uv),
    quadCull: Uint8Array.from(cull),
  };
}
