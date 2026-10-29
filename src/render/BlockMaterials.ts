import { textures, Texture } from '../loaders/TextureManager';
import * as THREE from 'three';

type RenderLayer = 'opaque' | 'cutout' | 'transparent';
const layerFlags = (layer: RenderLayer) => ({
  transparent: layer === 'transparent',
  alphaTest: layer === 'cutout' ? 0.5 : 0,
  depthWrite: layer !== 'transparent',
});

function lambert(
  map: Texture,
  color: THREE.ColorRepresentation = 0xffffff,
  layer: RenderLayer = 'opaque',
) {
  const make = (t: THREE.Texture | undefined) =>
    new THREE.MeshLambertMaterial({ map: t, color, ...layerFlags(layer) });
  const multiFaced = Object.hasOwn(map, 'top') || Object.hasOwn(map, 'bottom');
  if (!multiFaced) return make(map.side);
  return [
    map.side,
    map.side,
    map.top,
    map.bottom ?? map.top,
    map.side,
    map.side,
  ].map(make);
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
    material: lambert(textures.oakLeaves, 0x79c05a, 'cutout'),
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
    material: lambert(textures.jungleLeaves, 0x79c05a, 'cutout'),
  },
  deepslate: { material: lambert(textures.deepslate) },
  deepslateCoalOre: { material: lambert(textures.deepslateCoalOre) },
  deepslateIronOre: { material: lambert(textures.deepslateIronOre) },
  amethystBlock: { material: lambert(textures.amethystBlock) },
  andesite: { material: lambert(textures.andesite) },
  copperOre: { material: lambert(textures.copperOre) },
  deepslateCopperOre: { material: lambert(textures.deepslateCopperOre) },
  emeraldOre: { material: lambert(textures.emeraldOre) },
  deepslateEmeraldOre: { material: lambert(textures.deepslateEmeraldOre) },
  lapisOre: { material: lambert(textures.lapisOre) },
  deepslateLapisOre: { material: lambert(textures.deepslateLapisOre) },
  goldOre: { material: lambert(textures.goldOre) },
  deepslateGoldOre: { material: lambert(textures.deepslateGoldOre) },
  redstoneOre: { material: lambert(textures.redstoneOre) },
  deepslateRedstoneOre: { material: lambert(textures.deepslateRedstoneOre) },
  diamondOre: { material: lambert(textures.diamondOre) },
  deepslateDiamondOre: { material: lambert(textures.deepslateDiamondOre) },
  gravel: { material: lambert(textures.gravel) },
  granite: { material: lambert(textures.granite) },
  diorite: { material: lambert(textures.diorite) },
  tuff: { material: lambert(textures.tuff) },
  blueIce: { material: lambert(textures.blueIce) },
  buddingAmethyst: { material: lambert(textures.buddingAmethyst) },
  rawCopperBlock: { material: lambert(textures.rawCopperBlock) },
  rawIronBlock: { material: lambert(textures.rawIronBlock) },
  rawGoldBlock: { material: lambert(textures.rawGoldBlock) },
  cobbledDeepslate: { material: lambert(textures.cobbledDeepslate) },
  coarseDirt: { material: lambert(textures.coarseDirt) },
  clay: { material: lambert(textures.clay) },
  calcite: { material: lambert(textures.calcite) },
  obsidian: { material: lambert(textures.obsidian) },
  dripstoneBlock: { material: lambert(textures.dripstoneBlock) },
  ice: { material: lambert(textures.ice, 0xffffff, 'transparent') },
  mangroveRoots: { material: lambert(textures.mangroveRoots) },
  melon: { material: lambert(textures.melon) },
  mossBlock: { material: lambert(textures.mossBlock) },
};
