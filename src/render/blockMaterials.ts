import { textures } from '../loaders/TextureManager';
import * as THREE from 'three';

export const blockMaterials = {
  stone: {
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
  },
  grassBlock: {
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassBlock.side }), // right
      new THREE.MeshLambertMaterial({ map: textures.grassBlock.side }), // left
      new THREE.MeshLambertMaterial({
        map: textures.grassBlock.top,
        color: 0x79c05a,
      }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grassBlock.side }), // front
      new THREE.MeshLambertMaterial({ map: textures.grassBlock.side }), // back
    ],
  },
  dirt: {
    material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
  },
  cobblestone: {
    material: new THREE.MeshLambertMaterial({ map: textures.cobblestone }),
  },
  cloud: {
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
  },
  sand: {
    material: new THREE.MeshLambertMaterial({ map: textures.sand }),
  },
  ironOre: {
    material: new THREE.MeshLambertMaterial({ map: textures.ore.iron }),
  },
  coalOre: {
    material: new THREE.MeshLambertMaterial({ map: textures.ore.coal }),
  },
  oakLog: {
    material: [
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.top }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.top }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
    ],
  },
  oakLeaves: {
    material: new THREE.MeshLambertMaterial({
      map: textures.leaves.oak,
      color: 0x79c05a,
    }),
  },
  snow: {
    material: new THREE.MeshLambertMaterial({ map: textures.snow }),
  },
  cactus: {
    material: [
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.top }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.top }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
    ],
  },
  jungleLog: {
    material: [
      new THREE.MeshLambertMaterial({ map: textures.log.jungle.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.jungle.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.jungle.top }),
      new THREE.MeshLambertMaterial({ map: textures.log.jungle.top }),
      new THREE.MeshLambertMaterial({ map: textures.log.jungle.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.jungle.side }),
    ],
  },
  jungleLeaves: {
    material: new THREE.MeshLambertMaterial({
      map: textures.leaves.jungle,
      color: 0x79c05a,
    }),
  },
};
