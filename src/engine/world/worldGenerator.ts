import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { RNG } from '../../utils/Rng';
import { WorldParams } from './WorldParams';
import { ChunkData, EMPTY_ID } from './ChunkData';
import { CHUNK_WIDTH, MAX_Y, MIN_Y } from './constants';
import { Block } from '../blocks/blockParams';
import { inLocalBounds } from './coords';
import { blocks, resources } from '../../objects/blocks/blocksRegistry';
import { BiomeName, getBiome } from './biomes';
import { hashRandom } from './hash';

export function generateChunkData(
  params: WorldParams,
  x: number,
  z: number,
): ChunkData {
  const data = new ChunkData();
  const rng = new RNG(params.seed);
  const noise = new SimplexNoise(rng);

  generateTerrain(params, data, noise, x, z);
  generateTrees(data, params, noise, x, z);
  generateClouds(noise, params, data, x, z);

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

function columnAt(
  simplex: SimplexNoise,
  params: WorldParams,
  x: number,
  z: number,
) {
  return {
    biome: getBiome(simplex, x, z, params),
    height: surfaceHeight(simplex, params, x, z),
  };
}

const LAYER_OFFSET = { continent: 100, hills: 200, mountains: 300 };

function fractalNoise(
  simplex: SimplexNoise,
  x: number,
  z: number,
  octaves: number,
  persistence: number,
): number {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * simplex.noise(x * frequency, z * frequency);
    total += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  return sum / total;
}

function surfaceHeight(
  simplex: SimplexNoise,
  params: WorldParams,
  x: number,
  z: number,
): number {
  const { baseHeight, continent, hills, mountains, waterLevel } =
    params.terrain;

  const continentNoise = simplex.noise(
    x / continent.scale + LAYER_OFFSET.continent,
    z / continent.scale + LAYER_OFFSET.continent,
  );
  const hillNoise = fractalNoise(
    simplex,
    x / hills.scale + LAYER_OFFSET.hills,
    z / hills.scale + LAYER_OFFSET.hills,
    hills.octaves,
    hills.persistence,
  );
  let height =
    baseHeight +
    continentNoise * continent.amplitude +
    hillNoise * hills.amplitude;

  // Mountains only rise on land: they fade in over the first few blocks above sea level
  const mountainNoise = simplex.noise(
    x / mountains.scale + LAYER_OFFSET.mountains,
    z / mountains.scale + LAYER_OFFSET.mountains,
  );
  const mask = Math.max(
    0,
    (mountainNoise - mountains.threshold) / (1 - mountains.threshold),
  );
  const onLand = Math.min(1, Math.max(0, (height - waterLevel) / 8));
  height += mask ** mountains.power * mountains.amplitude * onLand;

  return Math.max(MIN_Y, Math.min(Math.floor(height), MAX_Y - 1));
}

export function surfaceHeightAt(
  params: WorldParams,
  x: number,
  z: number,
): number {
  return surfaceHeight(new SimplexNoise(new RNG(params.seed)), params, x, z);
}

/**
 * Generates the terrain data for the world
 * @param {RNG} rng
 */
function generateTerrain(
  params: WorldParams,
  data: ChunkData,
  simplex: SimplexNoise,
  chunkX: number,
  chunkZ: number,
) {
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      const { biome, height } = columnAt(
        simplex,
        params,
        chunkX + x,
        chunkZ + z,
      );

      for (let y = MAX_Y; y >= MIN_Y; y--) {
        if (y <= params.terrain.waterLevel && y === height) {
          setBlock(data, x, y, z, blocks.sand);
          continue;
        }

        if (y === height) {
          setBlock(data, x, y, z, getSurfaceBlock(biome));
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
  simplex: SimplexNoise,
  params: WorldParams,
  data: ChunkData,
  chunkX: number,
  chunkZ: number,
) {
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      const value =
        (simplex.noise(
          (chunkX + x) / params.clouds.scale,
          (chunkZ + z) / params.clouds.scale,
        ) +
          1) *
        0.5;

      const { height } = params.clouds;
      if (
        value < params.clouds.density &&
        data.getId(x, height, z) === EMPTY_ID
      ) {
        setBlock(data, x, height, z, blocks.cloud);
      }
    }
  }
}

const SALT = { tree: 1, trunkHeight: 2, canopyRadius: 3, leaf: 100 };

export interface Tree {
  x: number;
  z: number;
  groundY: number;
  biome: BiomeName;
  trunkHeight: number;
  canopyRadius: number;
}

export function collectTrees(
  params: WorldParams,
  simplex: SimplexNoise,
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
  margin: number,
): Tree[] {
  const { trunk, canopy, frequency } = params.trees;
  const trees: Tree[] = [];

  for (let x = minX - margin; x < maxX + margin; x++) {
    for (let z = minZ - margin; z < maxZ + margin; z++) {
      if (hashRandom(params.seed, x, z, SALT.tree) >= frequency) continue;

      const { biome, height } = columnAt(simplex, params, x, z);
      if (height <= params.terrain.waterLevel) continue; // sand, no trees

      trees.push({
        x,
        z,
        groundY: height,
        biome,
        trunkHeight: Math.round(
          trunk.minHeight +
            (trunk.maxHeight - trunk.minHeight) *
              hashRandom(params.seed, x, z, SALT.trunkHeight),
        ),
        canopyRadius: Math.round(
          canopy.minRadius +
            (canopy.maxRadius - canopy.minRadius) *
              hashRandom(params.seed, x, z, SALT.canopyRadius),
        ),
      });
    }
  }
  return trees;
}

const hasCanopy = (biome: BiomeName) =>
  biome === 'Temperate' || biome === 'Jungle';

export const treeTopY = (tree: Tree) => tree.groundY + 1 + tree.trunkHeight;

export function hasLeaf(
  params: WorldParams,
  tree: Tree,
  x: number,
  y: number,
  z: number,
) {
  if (!hasCanopy(tree.biome)) return false;

  const dx = x - tree.x;
  const dy = y - treeTopY(tree);
  const dz = z - tree.z;
  const r = tree.canopyRadius;
  if (dx * dx + dy * dy + dz * dz >= r * r) return false;

  return (
    hashRandom(params.seed, x, z, SALT.leaf + y) < params.trees.canopy.density
  );
}

function generateTrees(
  data: ChunkData,
  params: WorldParams,
  simplex: SimplexNoise,
  offsetX: number,
  offsetZ: number,
) {
  const margin = Math.ceil(params.trees.canopy.maxRadius);
  const trees = collectTrees(
    params,
    simplex,
    offsetX,
    offsetZ,
    offsetX + CHUNK_WIDTH,
    offsetZ + CHUNK_WIDTH,
    margin,
  );

  for (const tree of trees) {
    if (!hasCanopy(tree.biome)) continue;

    const leaves =
      tree.biome === 'Jungle' ? blocks.jungleLeaves : blocks.oakLeaves;
    const r = tree.canopyRadius;
    const top = treeTopY(tree);

    for (let x = tree.x - r; x <= tree.x + r; x++) {
      for (let y = top - r; y <= top + r; y++) {
        for (let z = tree.z - r; z <= tree.z + r; z++) {
          const lx = x - offsetX;
          const lz = z - offsetZ;
          if (!inLocalBounds(lx, y, lz)) continue;

          if (
            data.getId(lx, y, lz) === EMPTY_ID &&
            hasLeaf(params, tree, x, y, z)
          ) {
            data.set(lx, y, lz, leaves.id);
          }
        }
      }
    }
  }

  for (const tree of trees) {
    const lx = tree.x - offsetX;
    const lz = tree.z - offsetZ;
    const log = trunkBlock(tree.biome);

    for (let y = tree.groundY + 1; y <= treeTopY(tree); y++) {
      if (!inLocalBounds(lx, y, lz)) continue;

      const current = data.getId(lx, y, lz);
      if (
        current === EMPTY_ID ||
        current === blocks.oakLeaves.id ||
        current === blocks.jungleLeaves.id
      ) {
        data.set(lx, y, lz, log);
      }
    }
  }
}

function trunkBlock(biome: BiomeName): number {
  switch (biome) {
    case 'Jungle':
      return blocks.jungleLog.id;
    case 'Desert':
      return blocks.cactus.id;
    default:
      return blocks.oakLog.id;
  }
}
