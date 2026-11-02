import { textures } from '../../loaders/TextureManager';
import * as THREE from 'three';
import { CubeTextures, FaceTint, Rotation, ShapeName, Tint } from './Shapes';

export type RenderLayer = 'opaque' | 'cutout' | 'transparent';

export interface BlockRender {
  model: ShapeName;
  textures: CubeTextures;
  layer: RenderLayer;
  tint?: number | Tint; // number = fixed colour, 'grass'/'foliage' = biome colour, all faces
  faceTint?: FaceTint;
  cullSame?: boolean;
  rotation?: Rotation;
}

export const cube = (
  textures: CubeTextures,
  render: Partial<Omit<BlockRender, 'model' | 'textures'>> = {},
): BlockRender => ({ model: 'cube', textures, layer: 'opaque', ...render });

export const blockRender: Record<string, BlockRender> = {
  stone: cube(textures.stone),
  grassBlock: cube(textures.grassBlock, { faceTint: { top: 'grass' } }),
  dirt: cube(textures.dirt),
  cobblestone: cube(textures.cobblestone),
  bedrock: cube(textures.bedrock),
  sand: cube(textures.sand),
  ironOre: cube(textures.ironOre),
  coalOre: cube(textures.coalOre),
  oakLog: cube(textures.oakLog, { rotation: 'axis' }),
  oakLeaves: cube(textures.oakLeaves, { layer: 'cutout', tint: 'foliage' }),
  snow: cube(textures.snow),
  cactus: cube(textures.cactus),
  jungleLog: cube(textures.jungleLog, { rotation: 'axis' }),
  jungleLeaves: cube(textures.jungleLeaves, {
    layer: 'cutout',
    tint: 'foliage',
  }),
  deepslate: cube(textures.deepslate, { rotation: 'axis' }), // check block states
  deepslateCoalOre: cube(textures.deepslateCoalOre),
  deepslateIronOre: cube(textures.deepslateIronOre),
  amethystBlock: cube(textures.amethystBlock),
  andesite: cube(textures.andesite),
  copperOre: cube(textures.copperOre),
  deepslateCopperOre: cube(textures.deepslateCopperOre),
  emeraldOre: cube(textures.emeraldOre),
  deepslateEmeraldOre: cube(textures.deepslateEmeraldOre),
  lapisOre: cube(textures.lapisOre),
  deepslateLapisOre: cube(textures.deepslateLapisOre),
  goldOre: cube(textures.goldOre),
  deepslateGoldOre: cube(textures.deepslateGoldOre),
  redstoneOre: cube(textures.redstoneOre),
  deepslateRedstoneOre: cube(textures.deepslateRedstoneOre),
  diamondOre: cube(textures.diamondOre),
  deepslateDiamondOre: cube(textures.deepslateDiamondOre),
  gravel: cube(textures.gravel),
  granite: cube(textures.granite),
  diorite: cube(textures.diorite),
  tuff: cube(textures.tuff),
  blueIce: cube(textures.blueIce),
  buddingAmethyst: cube(textures.buddingAmethyst),
  rawCopperBlock: cube(textures.rawCopperBlock),
  rawIronBlock: cube(textures.rawIronBlock),
  rawGoldBlock: cube(textures.rawGoldBlock),
  cobbledDeepslate: cube(textures.cobbledDeepslate),
  coarseDirt: cube(textures.coarseDirt),
  clay: cube(textures.clay),
  calcite: cube(textures.calcite),
  obsidian: cube(textures.obsidian),
  dripstoneBlock: cube(textures.dripstoneBlock),
  ice: cube(textures.ice, { layer: 'transparent' }),
  mangroveRoots: cube(textures.mangroveRoots),
  melon: cube(textures.melon),
  mossBlock: cube(textures.mossBlock),
};

export function getTextures(): Set<THREE.Texture> {
  const set = new Set<THREE.Texture>();
  for (const block of Object.values(blockRender)) {
    for (const texture of Object.values(block.textures))
      if (texture) set.add(texture);
  }
  return set;
}
