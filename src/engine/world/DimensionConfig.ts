import { BlockKey } from '../blocks/BlockParams';
import { BiomeSourceId } from './BiomeSource';
import { MAX_Y, MIN_Y } from './Constants';

export type DimensionId = 'overworld';

type OreTypes = 'stone' | 'deepslate';
export interface OreParams {
  types: OreTypes[];
  block: BlockKey;
  scale: { x: number; y: number; z: number };
  scarcity: number;
}

export interface DimensionConfig {
  id: DimensionId;
  seed: number;
  minY: number; // inclusive
  maxY: number; // exclusive, like MAX_Y
  seaLevel: number; // Y of the top water-filled block
  biomeSource: BiomeSourceId;
  terrain: {
    soilDepth: number; // waterLevel removed
    baseHeight: number;
    continent: { scale: number; amplitude: number };
    hills: {
      scale: number;
      amplitude: number;
      octaves: number;
      persistence: number;
    };
    mountains: {
      scale: number;
      amplitude: number;
      threshold: number;
      power: number;
    };
  };
  biomes: {
    temperature: { scale: number };
    humidity: { scale: number };
    snowLine: number;
  };
  trees: {
    trunk: { minHeight: number; maxHeight: number };
    canopy: { minRadius: number; maxRadius: number; density: number };
    frequency: number;
  };
  ores: Record<string, OreParams>;
  clouds: { enabled: boolean; scale: number; density: number; height: number };
}

export const WATER_SURFACE_OFFSET = 0.4;
export const waterSurfaceY = (c: DimensionConfig) =>
  c.seaLevel + WATER_SURFACE_OFFSET;

export function assertDimensionBounds(c: DimensionConfig): void {
  if (c.minY < MIN_Y || c.maxY > MAX_Y || c.minY >= c.maxY) {
    throw new Error(
      `Dimension ${c.id}: Y range must fit inside ${MIN_Y}..${MAX_Y}`,
    );
  }
  if (c.seaLevel < c.minY || c.seaLevel >= c.maxY) {
    throw new Error(`Dimension ${c.id}: sea level is outside its Y range`);
  }
}
