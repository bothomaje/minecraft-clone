import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export const textures = {
  dirt: loadTexture('textures/block/dirt.png'),
  grass: {
    top: loadTexture('textures/block/grass_block_top.png'),
    side: loadTexture('textures/block/grass_block_side.png'),
  },
  stone: loadTexture('textures/block/stone.png'),
  ore: {
    coal: loadTexture('textures/block/coal_ore.png'),
    iron: loadTexture('textures/block/iron_ore.png'),
  },
  leaves: {
    oak: loadTexture('textures/block/oak_leaves.png'),
    jungle: loadTexture('textures/block/jungle_leaves.png'),
  },
  log: {
    oak: {
      top: loadTexture('textures/block/oak_log_top.png'),
      side: loadTexture('textures/block/oak_log.png'),
    },
    jungle: {
      top: loadTexture('textures/block/jungle_log_top.png'),
      side: loadTexture('textures/block/jungle_log.png'),
    },
  },
  sand: loadTexture('textures/block/sand.png'),
  snow: loadTexture('textures/block/snow.png'),
  cactus: {
    top: loadTexture('textures/block/cactus_top.png'),
    side: loadTexture('textures/block/cactus_side.png'),
  },
};
