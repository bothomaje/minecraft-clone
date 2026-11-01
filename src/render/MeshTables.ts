import * as THREE from 'three';
import {
  Block,
  BlockCategory,
  blockParams,
} from '../engine/blocks/BlockParams';
import { blockMaterials } from './BlockMaterials';
import { Layer, MeshTables } from './ChunkMesher';

export const materialTable: THREE.Material[] = [];
const materialIndex = new Map<THREE.Material, number>();
const register = (m: THREE.Material) => {
  let i = materialIndex.get(m);
  if (i === undefined) {
    i = materialTable.length;
    materialTable.push(m);
    materialIndex.set(m, i);
  }
  return i;
};

function layerOf(b: Block): number {
  if (b.id === 0) return Layer.NONE;
  switch (b.category) {
    case BlockCategory.CUTOUT:
      return Layer.CUTOUT;
    case BlockCategory.TRANSPARENT:
    case BlockCategory.LIQUID:
      return Layer.TRANSPARENT;
    default:
      return Layer.OPAQUE; // SOLID, and NON_SOLID that renders (clouds)
  }
}

export function buildMeshTables(): MeshTables {
  const entries = Object.entries(blockParams) as [string, Block][];
  const size = Math.max(...entries.map(([, b]) => b.id)) + 1;
  const t: MeshTables = {
    layer: new Uint8Array(size),
    opaque: new Uint8Array(size),
    cullSame: new Uint8Array(size),
    hasAxis: new Uint8Array(size),
    faceMaterial: new Uint16Array(size * 6),
  };
  const mats = blockMaterials as Record<
    string,
    { material: THREE.Material | THREE.Material[] }
  >;

  for (const [key, b] of entries) {
    const material = mats[key]?.material;
    if (!material) continue; // e.g. empty
    t.layer[b.id] = layerOf(b);
    t.opaque[b.id] = b.opaque ? 1 : 0;
    t.cullSame[b.id] =
      t.layer[b.id] === Layer.TRANSPARENT || key === 'cloud' ? 1 : 0;
    t.hasAxis[b.id] = b.stateSchema?.axis ? 1 : 0;
    for (let f = 0; f < 6; f++) {
      t.faceMaterial[b.id * 6 + f] = register(
        Array.isArray(material) ? material[f] : material,
      );
    }
  }
  return t;
}
