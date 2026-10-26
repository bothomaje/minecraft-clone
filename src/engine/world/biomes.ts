import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { WorldParams } from './WorldParams';

export type BiomeName = 'Tundra' | 'Temperate' | 'Jungle' | 'Desert';
/**
 * Get the biome at the world coordinates (x,z)
 * @param {SimplexNoise} simplex
 * @param {number} chunkX
 * @param {number} chunkZ
 * @param {number} x
 * @param {number} z
 * @param {object} params
 */
export function getBiome(
  simplex: SimplexNoise,
  x: number,
  z: number,
  params: WorldParams,
): BiomeName {
  // Compute the noise value at this x-z location
  let noise =
    0.5 * simplex.noise(x / params.biomes.scale, z / params.biomes.scale) + 0.5;

  noise +=
    params.biomes.variation.amplitude *
    simplex.noise(
      x / params.biomes.variation.scale,
      z / params.biomes.variation.scale,
    );

  if (noise < params.biomes.tundraToTemperate) return 'Tundra';
  else if (noise < params.biomes.temperateToJungle) return 'Temperate';
  else if (noise < params.biomes.jungleToDesert) return 'Jungle';
  else return 'Desert';
}
