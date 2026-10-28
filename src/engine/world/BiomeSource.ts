import { blockParams } from '../blocks/BlockParams';
import { BoxIndex } from './biomeIndex';
import { Biome, Climate, overworldBiomes } from './Biomes';

export interface BiomeSource {
  readonly biomes: Readonly<Record<string, Biome>>;
  readonly maxTreeDensity: number;
  readonly leafIds: ReadonlySet<number>;
  pick(climate: Climate, elevation: number): string;
}

export function createBiomeSource(
  biomes: Readonly<Record<string, Biome>>,
): BiomeSource {
  const index = new BoxIndex(
    Object.entries(biomes).map(([name, biome]) => ({
      value: name,
      boxes: biome.where,
    })),
  );
  const point: [number, number, number] = [0, 0, 0];

  const leafIds = new Set<number>();
  let maxTreeDensity = 0;
  for (const biome of Object.values(biomes)) {
    if (biome.tree?.leaves) leafIds.add(blockParams[biome.tree.leaves].id);
    maxTreeDensity = Math.max(maxTreeDensity, biome.tree?.density ?? 0);
  }

  return {
    biomes,
    maxTreeDensity,
    leafIds,
    pick(climate, elevation) {
      point[0] = climate.temperature;
      point[1] = climate.humidity;
      point[2] = elevation;
      return index.find(point);
    },
  };
}

export const biomeSources = {
  overworld: createBiomeSource(overworldBiomes),
} as const;

export type BiomeSourceId = keyof typeof biomeSources;
