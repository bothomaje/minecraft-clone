import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { RNG } from '../../utils/Rng';
import { WorldParams } from './WorldParams';
import { ChunkData, EMPTY_ID } from './ChunkData';
import { CHUNK_WIDTH, MAX_Y, MIN_Y } from './constants';
import { Block } from '../blocks/blockParams';
import { inLocalBounds } from './coords';
import { blocks, resources } from '../../objects/blocks/blocksRegistry';
import {
  BiomeName,
  biomes,
  Climate,
  maxTreeDensity,
  pickBiome,
} from './biomes';
import { hashRandom } from './hash';

const SALT = {
  tree: 1,
  trunkHeight: 2,
  canopyRadius: 3,
  soil: 4,
  bedrock: 5,
  leaf: 100,
};

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
  const height = surfaceHeight(simplex, params, x, z);
  const biome = pickBiome(params, climateAt(simplex, params, x, z), height);
  return { biome, height };
}

const LAYER_OFFSET = {
  continent: 100,
  hills: 200,
  mountains: 300,
  temperature: 400,
  humidity: 500,
};

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

export function climateAt(
  simplex: SimplexNoise,
  params: WorldParams,
  x: number,
  z: number,
): Climate {
  const { temperature, humidity } = params.biomes;
  return {
    temperature: fractalNoise(
      simplex,
      x / temperature.scale + LAYER_OFFSET.temperature,
      z / temperature.scale + LAYER_OFFSET.temperature,
      2,
      0.5,
    ),
    humidity: fractalNoise(
      simplex,
      x / humidity.scale + LAYER_OFFSET.humidity,
      z / humidity.scale + LAYER_OFFSET.humidity,
      2,
      0.5,
    ),
  };
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

export function biomeAt(params: WorldParams, x: number, z: number): BiomeName {
  return columnAt(new SimplexNoise(new RNG(params.seed)), params, x, z).biome;
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
      const wx = chunkX + x;
      const wz = chunkZ + z;
      const { biome, height } = columnAt(simplex, params, wx, wz);

      const soil = soilLayers(biome, height, params);
      const soilDepth =
        params.terrain.soilDepth +
        Math.floor(hashRandom(params.seed, wx, wz, SALT.soil) * 2);
      const bedrockTop = bedrockTopY(params.seed, wx, wz);

      for (let y = MIN_Y; y <= height; y++) {
        let block: Block;
        if (y <= bedrockTop) {
          block = blocks.bedrock;
        } else if (y === height) {
          block = soil.top;
        } else if (y > height - soilDepth) {
          block = soil.filler;
        } else {
          block = stoneOrOre(simplex, wx, y, wz);
        }

        setBlock(data, x, y, z, block);
      }
    }
  }
}

function soilLayers(biome: BiomeName, height: number, params: WorldParams) {
  const definition = biomes[biome];
  const capped = biome === 'mountains' && height >= params.biomes.snowLine;
  return {
    top: capped ? blocks.snow : blocks[definition.top],
    filler: blocks[definition.filler],
  };
}

function bedrockTopY(seed: number, x: number, z: number): number {
  let top = MIN_Y;
  if (hashRandom(seed, x, z, SALT.bedrock) < 0.6) {
    top++;
    if (hashRandom(seed, x, z, SALT.bedrock + 1) < 0.5) top++;
  }
  return top;
}

function stoneOrOre(
  simplex: SimplexNoise,
  x: number,
  y: number,
  z: number,
): Block {
  let block = blocks.stone;

  for (const resource of resources) {
    if (!isOreResource(resource)) continue;

    const value = simplex.noise3d(
      x / resource.scale.x,
      y / resource.scale.y,
      z / resource.scale.z,
    );
    if (value > resource.scarcity) block = resource;
  }
  return block;
}

type OreResource = Block & {
  scale: { x: number; y: number; z: number };
  scarcity: number;
};

function isOreResource(resource: Block): resource is OreResource {
  const candidate = resource as Block & {
    scale?: { x?: unknown; y?: unknown; z?: unknown };
    scarcity?: unknown;
  };

  return (
    candidate.scale !== undefined &&
    typeof candidate.scale.x === 'number' &&
    typeof candidate.scale.y === 'number' &&
    typeof candidate.scale.z === 'number' &&
    typeof candidate.scarcity === 'number'
  );
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
      const chance = hashRandom(params.seed, x, z, SALT.tree);
      if (chance >= frequency * maxTreeDensity) continue;

      const { biome, height } = columnAt(simplex, params, x, z);
      const tree = biomes[biome].tree;
      if (!tree || chance >= frequency * tree.density) continue;

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

const hasCanopy = (biome: BiomeName) => biomes[biome].tree?.leaves != null;

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

    const leaves = biomes[tree.biome].tree!.leaves!;
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
            data.set(lx, y, lz, blocks[leaves].id);
          }
        }
      }
    }
  }

  for (const tree of trees) {
    const lx = tree.x - offsetX;
    const lz = tree.z - offsetZ;
    const log = biomes[tree.biome].tree!.trunk;

    for (let y = tree.groundY + 1; y <= treeTopY(tree); y++) {
      if (!inLocalBounds(lx, y, lz)) continue;

      const current = data.getId(lx, y, lz);
      if (current === EMPTY_ID || isLeaves(current)) {
        data.set(lx, y, lz, blocks[log].id);
      }
    }
  }
}

const LEAF_IDS = new Set(
  Object.values(biomes).flatMap((biome) =>
    biome.tree?.leaves ? [blocks[biome.tree.leaves].id] : [],
  ),
);
const isLeaves = (id: number) => LEAF_IDS.has(id);
