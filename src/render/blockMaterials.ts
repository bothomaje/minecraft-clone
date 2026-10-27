import { textures, Texture } from '../loaders/TextureManager';
import * as THREE from 'three';

function lambert(
  map: Texture,
  color: THREE.ColorRepresentation = 0xffffff,
  transparent: boolean = false,
) {
  const materials: THREE.MeshLambertMaterial[] = [];
  const multiFaced = Object.hasOwn(map, 'top') || Object.hasOwn(map, 'bottom');

  if (multiFaced) {
    materials.push(
      new THREE.MeshLambertMaterial({ map: map.side, transparent, color }),
      new THREE.MeshLambertMaterial({ map: map.side, transparent, color }),
      new THREE.MeshLambertMaterial({ map: map.top, transparent, color }),
      new THREE.MeshLambertMaterial({
        map: map.bottom ?? map.top,
        transparent,
        color,
      }),
      new THREE.MeshLambertMaterial({ map: map.side, transparent, color }),
      new THREE.MeshLambertMaterial({ map: map.side, transparent, color }),
    );

    return materials;
  }

  return new THREE.MeshLambertMaterial({
    map: map.side,
    transparent,
    color,
  });
}

export const blockMaterials = {
  stone: {
    material: lambert(textures.stone),
  },
  grassBlock: {
    material: lambert(textures.grassBlock),
  },
  dirt: {
    material: lambert(textures.dirt),
  },
  cobblestone: {
    material: lambert(textures.cobblestone),
  },
  bedrock: {
    material: lambert(textures.bedrock),
  },
  cloud: {
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
  },
  sand: {
    material: lambert(textures.sand),
  },
  ironOre: {
    material: lambert(textures.ironOre),
  },
  coalOre: {
    material: lambert(textures.coalOre),
  },
  oakLog: {
    material: lambert(textures.oakLog),
  },
  oakLeaves: {
    material: lambert(textures.oakLeaves, 0x79c05a, true),
  },
  snow: {
    material: lambert(textures.snow),
  },
  cactus: {
    material: lambert(textures.cactus),
  },
  jungleLog: {
    material: lambert(textures.jungleLog),
  },
  jungleLeaves: {
    material: lambert(textures.jungleLeaves, 0x79c05a, true),
  },
};
