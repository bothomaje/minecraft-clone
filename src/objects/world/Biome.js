/**
 * Get the biome at the world coordinates (x,z)
 * @param {SimplexNoise} simplex
 * @param {number} chunkX
 * @param {number} chunkZ
 * @param {number} blockX
 * @param {number} blockZ
 * @param {object} params
 */
export function getBiome(simplex, chunkX, chunkZ, blockX, blockZ, params) {
  // Compute the noise value at this x-z location
  let noise =
    0.5 *
      simplex.noise(
        (chunkX + blockX) / params.biomes.scale,
        (chunkZ + blockZ) / params.biomes.scale,
      ) +
    0.5;

  noise +=
    params.biomes.variation.amplitude *
    simplex.noise(
      (chunkX + blockX) / params.biomes.variation.scale,
      (chunkZ + blockZ) / params.biomes.variation.scale,
    );

  if (noise < params.biomes.tundraToTemperate) return 'Tundra';
  else if (noise < params.biomes.temperateToJungle) return 'Temperate';
  else if (noise < params.biomes.jungleToDesert) return 'Jungle';
  else return 'Desert';
}
