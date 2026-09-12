import * as THREE from 'three';
import { textures } from '../../loaders/TextureManager';

const BlockCategory = {
  SOLID: 'solid',
  TRANSPARENT: 'transparent',
  CUTOUT: 'cutout',
  LIQUID: 'liquid',
  NON_SOLID: 'non_solid',
};

export const blocks = {
  empty: {
    id: 0,
    name: 'empty',
    category: BlockCategory.NON_SOLID,
    solid: false,
    opaque: false,
    hardness: 0,
  },
  stone: {
    id: 1,
    name: 'stone',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 1.5,
    gravity: false,
    color: 0x808080,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
  },
  grassBlock: {
    id: 2,
    name: 'grass_block',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.6,
    gravity: false,
    color: 0x559020,
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
    id: 3,
    name: 'dirt',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.5,
    gravity: false,
    color: 0x807020,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
  },
  cloud: {
    id: 9,
    name: 'cloud',
    category: BlockCategory.NON_SOLID,
    solid: false,
    opaque: false,
    hardness: 0,
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
  },
  sand: {
    id: 12,
    name: 'sand',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.5,
    gravity: true,
    material: new THREE.MeshLambertMaterial({ map: textures.sand }),
  },
  ironOre: {
    id: 15,
    name: 'iron_ore',
    color: 0x806060,
    scale: { x: 60, y: 60, z: 60 },
    scarcity: 0.9,
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 3,
    material: new THREE.MeshLambertMaterial({ map: textures.ore.iron }),
  },
  coalOre: {
    id: 16,
    name: 'coal_ore',
    color: 0x202020,
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 3,
    material: new THREE.MeshLambertMaterial({ map: textures.ore.coal }),
  },
  oakLog: {
    id: 17,
    name: 'oak_log',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 2,
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
    id: 18,
    name: 'oak_leaves',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: false,
    hardness: 0.2,
    state: { axis: 'y' },
    material: new THREE.MeshLambertMaterial({
      map: textures.leaves.oak,
      color: 0x79c05a,
    }),
  },
  snow: {
    id: 80,
    name: 'snow',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.2,
    material: new THREE.MeshLambertMaterial({ map: textures.snow }),
  },
  cactus: {
    id: 81,
    name: 'cactus',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.4,
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
    id: -571,
    name: 'jungle_log',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 2,
    state: { axis: 'y' },
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
    id: -572,
    name: 'jungle_leaves',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: false,
    hardness: 0.2,
    material: new THREE.MeshLambertMaterial({
      map: textures.leaves.jungle,
      color: 0x79c05a,
    }),
  },
};

export const blocksById = new Map(
  Object.values(blocks).map((block) => [block.id, block]),
);
export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
