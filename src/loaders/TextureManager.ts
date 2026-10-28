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
  copperOre: {
    side: loadTexture('textures/block/copper_ore.png'),
  },
  deepslateCopperOre: {
    side: loadTexture('textures/block/deepslate_copper_ore.png'),
  },
  emeraldOre: {
    side: loadTexture('textures/block/emerald_ore.png'),
  },
  deepslateEmeraldOre: {
    side: loadTexture('textures/block/deepslate_emerald_ore.png'),
  },
  lapisOre: {
    side: loadTexture('textures/block/lapis_ore.png'),
  },
  deepslateLapisOre: {
    side: loadTexture('textures/block/deepslate_lapis_ore.png'),
  },
  goldOre: {
    side: loadTexture('textures/block/gold_ore.png'),
  },
  deepslateGoldOre: {
    side: loadTexture('textures/block/deepslate_gold_ore.png'),
  },
  redstoneOre: {
    side: loadTexture('textures/block/redstone_ore.png'),
  },
  deepslateRedstoneOre: {
    side: loadTexture('textures/block/deepslate_redstone_ore.png'),
  },
  diamondOre: {
    side: loadTexture('textures/block/diamond_ore.png'),
  },
  deepslateDiamondOre: {
    side: loadTexture('textures/block/deepslate_diamond_ore.png'),
  },
  gravel: {
    side: loadTexture('textures/block/gravel.png'),
  },
  granite: {
    side: loadTexture('textures/block/granite.png'),
  },
  diorite: {
    side: loadTexture('textures/block/diorite.png'),
  },
  tuff: {
    side: loadTexture('textures/block/tuff.png'),
  },
  blueIce: {
    side: loadTexture('textures/block/blue_ice.png'),
  },
  buddingAmethyst: {
    side: loadTexture('textures/block/budding_amethyst.png'),
  },
  rawCopperBlock: {
    side: loadTexture('textures/block/raw_copper_block.png'),
  },
  rawIronBlock: {
    side: loadTexture('textures/block/raw_iron_block.png'),
  },
  rawGoldBlock: {
    side: loadTexture('textures/block/raw_gold_block.png'),
  },
  cobbledDeepslate: {
    side: loadTexture('textures/block/cobbled_deepslate.png'),
  },
  coarseDirt: {
    side: loadTexture('textures/block/coarse_dirt.png'),
  },
  clay: {
    side: loadTexture('textures/block/clay.png'),
  },
  calcite: {
    side: loadTexture('textures/block/calcite.png'),
  },
  obsidian: {
    side: loadTexture('textures/block/obsidian.png'),
  },
  dripstoneBlock: {
    side: loadTexture('textures/block/dripstone_block.png'),
  },
  ice: {
    side: loadTexture('textures/block/ice.png'),
  },
  mangroveRoots: {
    side: loadTexture('textures/block/mangrove_roots_side.png'),
    top: loadTexture('textures/block/mangrove_roots_top.png'),
  },
  melon: {
    side: loadTexture('textures/block/melon_side.png'),
    top: loadTexture('textures/block/melon_top.png'),
  },
  mossBlock: {
    side: loadTexture('textures/block/moss_block.png'),
  },
} satisfies Record<string, Texture>;
