import * as THREE from 'three';
import { textures } from '../../loaders/TextureManager';

export const blocks = {
  empty: {
    id: 0,
    name: 'empty',
  },
  grass: {
    id: 1,
    name: 'grass',
    color: 0x559020,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grass.side }), // right
      new THREE.MeshLambertMaterial({ map: textures.grass.side }), // left
      new THREE.MeshLambertMaterial({
        map: textures.grass.top,
        color: 0x79c05a,
      }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grass.side }), // front
      new THREE.MeshLambertMaterial({ map: textures.grass.side }), // back
    ],
  },
  dirt: {
    id: 2,
    name: 'dirt',
    color: 0x807020,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
  },
  stone: {
    id: 3,
    name: 'stone',
    color: 0x808080,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
  },
  coalOre: {
    id: 4,
    name: 'coalOre',
    color: 0x202020,
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
    material: new THREE.MeshLambertMaterial({ map: textures.ore.coal }),
  },
  ironOre: {
    id: 5,
    name: 'ironOre',
    color: 0x806060,
    scale: { x: 60, y: 60, z: 60 },
    scarcity: 0.9,
    material: new THREE.MeshLambertMaterial({ map: textures.ore.iron }),
  },
  tree: {
    id: 6,
    name: 'tree',
    material: [
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.top }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.top }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
      new THREE.MeshLambertMaterial({ map: textures.log.oak.side }),
    ],
  },
  leaves: {
    id: 7,
    name: 'leaves',
    material: new THREE.MeshLambertMaterial({
      map: textures.leaves.oak,
      color: 0x79c05a,
    }),
  },
  sand: {
    id: 8,
    name: 'sand',
    material: new THREE.MeshLambertMaterial({ map: textures.sand }),
  },
  cloud: {
    id: 9,
    name: 'cloud',
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
  },
  snow: {
    id: 10,
    name: 'snow',
    material: new THREE.MeshLambertMaterial({ map: textures.snow }),
  },
  jungleTree: {
    id: 11,
    name: 'jungleTree',
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
    id: 12,
    name: 'jungleLeaves',
    material: new THREE.MeshLambertMaterial({
      map: textures.leaves.jungle,
      color: 0x79c05a,
    }),
  },
  cactus: {
    id: 13,
    name: 'cactus',
    material: [
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.top }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.top }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
      new THREE.MeshLambertMaterial({ map: textures.cactus.side }),
    ],
  },
};

export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
