import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { RNG } from '../../utils/Rng';
import { WorldParams } from './WorldParams';
import { ChunkData } from './ChunkData';
import { CHUNK_WIDTH, MAX_Y, MIN_Y } from './constants';
import { Block } from '../blocks/blockParams';
import { inLocalBounds } from './coords';
import { blocks, resources } from '../../objects/blocks/blocksRegistry';
import { BiomeName, getBiome } from './biomes';

export function generateChunkData(
  params: WorldParams,
  x: number,
  z: number,
): ChunkData {
  const data = new ChunkData();
  const rng = new RNG(params.seed);

  generateTerrain(rng, params, data, x, z);
  generateClouds(rng, params, data, x, z);

  return data;
}

/**
 * Sets the block id for the block at (x, y, z)
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {{id: number, instanceId: number, state: {...}} | null} block
 */
function setBlock(
  data: ChunkData,
  x: number,
  y: number,
  z: number,
  block: Block,
  state = 0,
) {
  if (inLocalBounds(x, y, z)) {
    data.set(x, y, z, block.id, state);
  }
}

/**
 * Generates the terrain data for the world
 * @param {RNG} rng
 */
function generateTerrain(
  rng: RNG,
  params: WorldParams,
  data: ChunkData,
  chunkX: number,
  chunkZ: number,
) {
  const simplex = new SimplexNoise(rng);

  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      const biome = getBiome(simplex, chunkX, chunkZ, x, z, params);

      // Compute the noise value at this x-z location
      const value = simplex.noise(
        (chunkX + x) / params.terrain.scale,
        (chunkZ + z) / params.terrain.scale,
      );

      // Scale the noise based on the magnitude/offset
      const scaledNoise =
        params.terrain.offset + params.terrain.magnitude * value;

      // Computing the height of the terrain at this x-z location
      let height = Math.floor(scaledNoise);

      // Clamping height between 0 and max height
      height = Math.max(MIN_Y, Math.min(height, MAX_Y - 1));

      // Fill in all blocks at or below the terrain height
      for (let y = MAX_Y; y >= MIN_Y; y--) {
        if (y <= params.terrain.waterLevel && y === height) {
          setBlock(data, x, y, z, blocks.sand);
          continue;
        }

        if (y === height) {
          setBlock(data, x, y, z, getSurfaceBlock(biome));
          if (rng.random() < params.trees.frequency) {
            generateTree(rng, params, data, biome, x, height + 1, z);
          }
          continue;
        }

        if (y < height && data.getId(x, y, z) === blocks.empty.id) {
          generateResource(data, simplex, chunkX, chunkZ, x, y, z);
        }
      }
    }
  }
}

function getSurfaceBlock(biome: BiomeName): Block {
  if (biome === 'Desert') return blocks.sand;
  if (biome === 'Tundra') return blocks.snow;
  return blocks.grassBlock;
}

/**
 * Determines if a resource block should be generated at (x, y, z)
 * @param {SimplexNoise} simplex
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function generateResource(
  data: ChunkData,
  simplex: SimplexNoise,
  chunkX: number,
  chunkZ: number,
  x: number,
  y: number,
  z: number,
) {
  setBlock(data, x, y, z, blocks.dirt);

  resources.forEach((resource) => {
    const value = simplex.noise3d(
      (chunkX + x) / resource.scale.x,
      y / resource.scale.y,
      (chunkZ + z) / resource.scale.z,
    );

    if (value > resource.scarcity) {
      setBlock(data, x, y, z, resource);
    }
  });
}

/**
 * Creates happy little clouds
 * @param {RNG} rng
 */
function generateClouds(
  rng: RNG,
  params: WorldParams,
  data: ChunkData,
  chunkX: number,
  chunkZ: number,
) {
  const simplex = new SimplexNoise(rng);
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      const value =
        (simplex.noise(
          (chunkX + x) / params.clouds.scale,
          (chunkZ + z) / params.clouds.scale,
        ) +
          1) *
        0.5;

      if (value < params.clouds.density) {
        setBlock(data, x, MAX_Y - 1, z, blocks.cloud);
      }
    }
  }
}

/**
 * Populate the world with trees
 * @param {RNG} rng
 * @param {string} biome
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function generateTree(
  rng: RNG,
  params: WorldParams,
  data: ChunkData,
  biome: BiomeName,
  x: number,
  y: number,
  z: number,
) {
  const minHeight = params.trees.trunk.minHeight;
  const maxHeight = params.trees.trunk.maxHeight;
  const height = Math.round(minHeight + (maxHeight - minHeight) * rng.random());

  // Tree trunk starts here
  for (let treeY = y; treeY <= y + height; treeY++) {
    if (biome === 'Temperate' || biome === 'Tundra') {
      setBlock(data, x, treeY, z, blocks.oakLog);
    } else if (biome === 'Jungle') {
      setBlock(data, x, treeY, z, blocks.jungleLog);
    } else if (biome === 'Desert') {
      setBlock(data, x, treeY, z, blocks.cactus);
    }
  }
  if (biome === 'Temperate' || biome === 'Jungle') {
    generateTreeCanopy(biome, x, y + height, z, rng, params, data);
  }
}

/**
 * Generate the canopy for a tree
 * @param {string} biome
 * @param {number} centreX
 * @param {number} centreY
 * @param {number} centreZ
 * @param {RNG} rng
 */
function generateTreeCanopy(
  biome: BiomeName,
  centreX: number,
  centreY: number,
  centreZ: number,
  rng: RNG,
  params: WorldParams,
  data: ChunkData,
) {
  const minRadius = params.trees.canopy.minRadius;
  const maxRadius = params.trees.canopy.maxRadius;
  const density = params.trees.canopy.density;
  const leaves = biome === 'Temperate' ? blocks.oakLeaves : blocks.jungleLeaves;
  const radius = Math.round(minRadius + (maxRadius - minRadius) * rng.random());

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        const n = rng.random();

        if (x * x + y * y + z * z >= radius * radius) continue;

        if (n < density) {
          setBlock(data, centreX + x, centreY + y, centreZ + z, leaves);
        }
      }
    }
  }
}
