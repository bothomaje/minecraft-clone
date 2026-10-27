import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path: string) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export interface Texture {
  side: THREE.Texture;
  top?: THREE.Texture;
  bottom?: THREE.Texture;
}

export const textures = {
  // breaking: Array.from({ length: 10 }, (_, stage) =>
  //   loadTexture(`textures/block/breaking/destroy_stage_${stage}.png`),
  // ),
  dirt: { side: loadTexture('textures/block/dirt.png') },
  grassBlock: {
    top: loadTexture('textures/block/grass_block_top.png'),
    side: loadTexture('textures/block/grass_block_side.png'),
    bottom: loadTexture('textures/block/dirt.png'),
  },
  stone: { side: loadTexture('textures/block/stone.png') },
  cobblestone: { side: loadTexture('textures/block/cobblestone.png') },
  ironOre: {
    side: loadTexture('textures/block/iron_ore.png'),
  },
  coalOre: {
    side: loadTexture('textures/block/coal_ore.png'),
  },
  oakLeaves: {
    side: loadTexture('textures/block/oak_leaves.png'),
  },
  jungleLeaves: {
    side: loadTexture('textures/block/jungle_leaves.png'),
  },
  oakLog: {
    top: loadTexture('textures/block/oak_log_top.png'),
    side: loadTexture('textures/block/oak_log.png'),
  },

  jungleLog: {
    top: loadTexture('textures/block/jungle_log_top.png'),
    side: loadTexture('textures/block/jungle_log.png'),
  },
  sand: { side: loadTexture('textures/block/sand.png') },
  snow: { side: loadTexture('textures/block/snow.png') },
  cactus: {
    top: loadTexture('textures/block/cactus_top.png'),
    side: loadTexture('textures/block/cactus_side.png'),
    bottom: loadTexture('textures/block/cactus_bottom.png'),
  },
  bedrock: { side: loadTexture('textures/block/bedrock.png') },
  deepslate: {
    side: loadTexture('textures/block/deepslate.png'),
    top: loadTexture('textures/block/deepslate_top.png'),
  },
  deepslateCoalOre: {
    side: loadTexture('textures/block/deepslate_coal_ore.png'),
  },
  deepslateIronOre: {
    side: loadTexture('textures/block/deepslate_iron_ore.png'),
  },
  amethystBlock: {
    side: loadTexture('textures/block/amethyst_block.png'),
  },
  andesite: {
    side: loadTexture('textures/block/andesite.png'),
  },
} satisfies Record<string, Texture>;
