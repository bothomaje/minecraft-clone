import * as THREE from 'three';
import { TextureAtlas } from './atlas/TextureAtlas';

export function createMaterials(atlas: TextureAtlas): THREE.Material[] {
  const base = { map: atlas.texture, vertexColors: true };
  return [
    new THREE.MeshLambertMaterial(base),
    new THREE.MeshLambertMaterial({ ...base, alphaTest: 0.5 }),
    new THREE.MeshLambertMaterial({
      ...base,
      transparent: true,
      depthWrite: false,
    }),
  ];
}
