import * as THREE from 'three';
import { textures } from '../../loaders/TextureManager';

const BlockCategory = {
  SOLID: 'solid',
  TRANSPARENT: 'transparent',
  CUTOUT: 'cutout',
  LIQUID: 'liquid',
  NON_SOLID: 'non_solid',
};

function getSoundSet(blockName) {
  return {
    place: `sounds/block/${blockName}/place.ogg`,
    break: `sounds/block/${blockName}/break.ogg`,
    broken: `sounds/block/${blockName}/broken.ogg`,
  };
}

const sounds = {
  dirt: getSoundSet('dirt'),
  grass: getSoundSet('grass'),
  sand: getSoundSet('sand'),
  snow: getSoundSet('snow'),
  stone: getSoundSet('stone'),
  wood: getSoundSet('wood'),
  wool: getSoundSet('wool'),
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
    requiredTool: 'pickaxe',
    color: 0x808080,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
    sounds: sounds.stone,
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
    sounds: sounds.grass,
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
    sounds: sounds.dirt,
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
    sounds: sounds.sand,
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
    requiredTool: 'stonePickaxe',
    material: new THREE.MeshLambertMaterial({ map: textures.ore.iron }),
    sounds: sounds.stone,
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
    requiredTool: 'pickaxe',
    material: new THREE.MeshLambertMaterial({ map: textures.ore.coal }),
    sounds: sounds.stone,
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
    sounds: sounds.wood,
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
    sounds: sounds.grass,
  },
  snow: {
    id: 80,
    name: 'snow',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.2,
    material: new THREE.MeshLambertMaterial({ map: textures.snow }),
    sounds: sounds.snow,
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
    sounds: sounds.wool,
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
    sounds: sounds.wood,
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
    sounds: sounds.grass,
  },
};

for (const block of Object.values(blocks)) {
  block.drops = block.id === blocks.empty.id ? null : block.id;
}

export const blocksById = new Map(
  Object.values(blocks).map((block) => [block.id, block]),
);
export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
