import { DimensionConfig } from './DimensionConfig';
import { MAX_Y, MIN_Y } from './Constants';

export const overworldConfig: DimensionConfig = {
  id: 'overworld',
  seed: 0,
  minY: MIN_Y,
  maxY: MAX_Y,
  seaLevel: 62,
  biomeSource: 'overworld',
  terrain: {
    soilDepth: 3,
    baseHeight: 66,
    continent: { scale: 500, amplitude: 14 },
    hills: { scale: 60, amplitude: 7, octaves: 3, persistence: 0.5 },
    mountains: { scale: 220, amplitude: 48, threshold: 0.15, power: 1.6 },
  },
  biomes: {
    temperature: { scale: 450 },
    humidity: { scale: 350 },
    snowLine: 105,
  },
  trees: {
    trunk: { minHeight: 5, maxHeight: 7 },
    canopy: { minRadius: 2, maxRadius: 3, density: 0.5 },
    frequency: 0.02,
  },
  ores: {
    coal: {
      types: ['stone'],
      block: 'coalOre',
      scale: { x: 20, y: 20, z: 20 },
      scarcity: 0.8,
    },
    deepslateCoal: {
      types: ['deepslate'],
      block: 'deepslateCoalOre',
      scale: { x: 20, y: 20, z: 20 },
      scarcity: 0.8,
    },
    iron: {
      types: ['stone'],
      block: 'ironOre',
      scale: { x: 60, y: 60, z: 60 },
      scarcity: 0.9,
    },
    deepslateIron: {
      types: ['deepslate'],
      block: 'deepslateIronOre',
      scale: { x: 60, y: 60, z: 60 },
      scarcity: 0.9,
    },
    andesite: {
      types: ['stone', 'deepslate'],
      block: 'andesite',
      scale: { x: 10, y: 10, z: 10 },
      scarcity: 0.4,
    },
  },
  clouds: { enabled: true, scale: 30, density: 0.5, height: 114 },
};

export const createOverworldConfig = (): DimensionConfig =>
  structuredClone(overworldConfig);
