import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from '../../utils/Rng';
import { DimensionConfig, waterSurfaceY } from './DimensionConfig';
import { ChunkData, EMPTY_ID } from './ChunkData';
import { CHUNK_WIDTH } from './Constants';
import { Block, blockParams } from '../blocks/BlockParams';
import { ChunkPos, inLocalBounds } from './Coords';
import { Climate } from './Biomes';
import { hashRandom } from './hash';
import { BiomeSource, biomeSources } from './BiomeSource';

const SALT = {
  tree: 1,
  trunkHeight: 2,
  canopyRadius: 3,
  soil: 4,
  deepslate: 11,
  bedrock: 5,
  leaf: 100,
};

let cachedNoise: { seed: number; noise: SimplexNoise } | undefined;

function getNoise(seed: number): SimplexNoise {
  if (cachedNoise?.seed !== seed) {
    cachedNoise = { seed, noise: new SimplexNoise(new RNG(seed)) };
  }
  return cachedNoise.noise;
}

interface Context {
  config: DimensionConfig;
  noise: SimplexNoise;
  source: BiomeSource;
}

function getContext(config: DimensionConfig): Context {
  return {
    config,
    noise: getNoise(config.seed),
    source: biomeSources[config.biomeSource],
  };
}

export function generateChunkData(
  config: DimensionConfig,
  chunk: ChunkPos,
): ChunkData {
  const context = getContext(config);
  const originX = chunk.x * CHUNK_WIDTH;
  const originZ = chunk.z * CHUNK_WIDTH;
  const data = new ChunkData();

  generateTerrain(data, context, originX, originZ);
  generateTrees(data, context, originX, originZ);
  generateClouds(data, context, originX, originZ);
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

function columnAt(context: Context, x: number, z: number) {
  const height = surfaceHeight(context.noise, context.config, x, z);
  const climate = climateAt(context.noise, context.config, x, z);
  const biome = context.source.pick(
    climate,
    height - waterSurfaceY(context.config),
  );
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
  config: DimensionConfig,
  x: number,
  z: number,
): Climate {
  const { temperature, humidity } = config.biomes;
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
  config: DimensionConfig,
  x: number,
  z: number,
): number {
  const { baseHeight, continent, hills, mountains } = config.terrain;
  const waterline = waterSurfaceY(config);

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

  const mountainNoise = simplex.noise(
    x / mountains.scale + LAYER_OFFSET.mountains,
    z / mountains.scale + LAYER_OFFSET.mountains,
  );
  const mask = Math.max(
    0,
    (mountainNoise - mountains.threshold) / (1 - mountains.threshold),
  );
  const onLand = Math.min(1, Math.max(0, (height - waterline) / 8));
  height += mask ** mountains.power * mountains.amplitude * onLand;

  return Math.max(config.minY, Math.min(Math.floor(height), config.maxY - 1));
}

export function surfaceHeightAt(
  config: DimensionConfig,
  x: number,
  z: number,
): number {
  return surfaceHeight(getNoise(config.seed), config, x, z);
}

export function biomeAt(config: DimensionConfig, x: number, z: number): string {
  return columnAt(getContext(config), x, z).biome;
}

/**
 * Generates the terrain data for the world
 * @param {RNG} rng
 */

function generateTerrain(
  data: ChunkData,
  context: Context,
  originX: number,
  originZ: number,
) {
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      const wx = originX + x;
      const wz = originZ + z;
      const { biome, height } = columnAt(context, wx, wz);

      const soil = soilLayers(biome, height, context);
      const soilDepth =
        context.config.terrain.soilDepth +
        Math.floor(hashRandom(context.config.seed, wx, wz, SALT.soil) * 2);
      const bedrockTop = bedrockTopY(
        context.config.seed,
        context.config.minY,
        wx,
        wz,
      );
      const deepslateTop = deepslateTopY(context.config.seed, 0, wx, wz);

      for (let y = context.config.minY; y <= height; y++) {
        let block: Block;
        if (y <= bedrockTop) {
          block = blockParams.bedrock;
        } else if (y <= deepslateTop) {
          block = deepslateOrOre(context, wx, y, wz);
        } else if (y === height) {
          block = soil.top;
        } else if (y > height - soilDepth) {
          block = soil.filler;
        } else {
          block = stoneOrOre(context, wx, y, wz);
        }

        setBlock(data, x, y, z, block);
      }
    }
  }
}

function soilLayers(biome: string, height: number, context: Context) {
  const definition = context.source.biomes[biome];
  const capped =
    biome === 'mountains' && height >= context.config.biomes.snowLine;
  return {
    top: capped ? blockParams.snow : blockParams[definition.top],
    filler: blockParams[definition.filler],
  };
}

function deepslateTopY(
  seed: number,
  minY: number,
  x: number,
  z: number,
): number {
  return minY + Math.round((1 - hashRandom(seed, x, z, SALT.deepslate)) * 10);
}

function deepslateOrOre(
  context: Context,
  x: number,
  y: number,
  z: number,
): Block {
  let block: Block = blockParams.deepslate;
  for (const ore of Object.values(context.config.ores)) {
    if (ore.types.includes('deepslate')) {
      const value = context.noise.noise3d(
        x / ore.scale.x,
        y / ore.scale.y,
        z / ore.scale.z,
      );
      if (value > ore.scarcity) block = blockParams[ore.block];
    }
  }
  return block;
}

function bedrockTopY(seed: number, minY: number, x: number, z: number): number {
  return (
    minY +
    Math.max(Math.round((1 - hashRandom(seed, x, z, SALT.bedrock)) * 10), 5)
  );
}

function stoneOrOre(context: Context, x: number, y: number, z: number): Block {
  let block: Block = blockParams.stone;
  for (const ore of Object.values(context.config.ores)) {
    if (ore.types.includes('stone')) {
      const value = context.noise.noise3d(
        x / ore.scale.x,
        y / ore.scale.y,
        z / ore.scale.z,
      );
      if (value > ore.scarcity) block = blockParams[ore.block];
    }
  }
  return block;
}

/**
 * Creates happy little clouds
 * @param {RNG} rng
 */
function generateClouds(
  data: ChunkData,
  context: Context,
  originX: number,
  originZ: number,
) {
  for (let x = 0; x < CHUNK_WIDTH; x++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      const value =
        (context.noise.noise(
          (originX + x) / context.config.clouds.scale,
          (originZ + z) / context.config.clouds.scale,
        ) +
          1) *
        0.5;

      const { height } = context.config.clouds;
      if (
        value < context.config.clouds.density &&
        data.getId(x, height, z) === EMPTY_ID
      ) {
        setBlock(data, x, height, z, blockParams.cloud);
      }
    }
  }
}

export interface PlacedTree {
  x: number;
  z: number;
  groundY: number;
  biome: string;
  trunkHeight: number;
  canopyRadius: number;
}

export function collectTrees(
  context: Context,
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
  margin: number,
): PlacedTree[] {
  const { trunk, canopy, frequency } = context.config.trees;
  const trees: PlacedTree[] = [];

  for (let x = minX - margin; x < maxX + margin; x++) {
    for (let z = minZ - margin; z < maxZ + margin; z++) {
      const chance = hashRandom(context.config.seed, x, z, SALT.tree);
      if (chance >= frequency * context.source.maxTreeDensity) continue;

      const { biome, height } = columnAt(context, x, z);
      const tree = context.source.biomes[biome].tree;
      if (!tree || chance >= frequency * tree.density) continue;

      trees.push({
        x,
        z,
        groundY: height,
        biome,
        trunkHeight: Math.round(
          trunk.minHeight +
            (trunk.maxHeight - trunk.minHeight) *
              hashRandom(context.config.seed, x, z, SALT.trunkHeight),
        ),
        canopyRadius: Math.round(
          canopy.minRadius +
            (canopy.maxRadius - canopy.minRadius) *
              hashRandom(context.config.seed, x, z, SALT.canopyRadius),
        ),
      });
    }
  }
  return trees;
}

const hasCanopy = (context: Context, biome: string) =>
  context.source.biomes[biome].tree?.leaves != null;

export const treeTopY = (tree: PlacedTree) =>
  tree.groundY + 1 + tree.trunkHeight;

export function hasLeaf(
  context: Context,
  tree: PlacedTree,
  x: number,
  y: number,
  z: number,
) {
  if (!hasCanopy(context, tree.biome)) return false;

  const dx = x - tree.x;
  const dy = y - treeTopY(tree);
  const dz = z - tree.z;
  const r = tree.canopyRadius;
  if (dx * dx + dy * dy + dz * dz >= r * r) return false;

  return (
    hashRandom(context.config.seed, x, z, SALT.leaf + y) <
    context.config.trees.canopy.density
  );
}

function generateTrees(
  data: ChunkData,
  context: Context,
  offsetX: number,
  offsetZ: number,
) {
  const margin = Math.ceil(context.config.trees.canopy.maxRadius);
  const trees = collectTrees(
    context,
    offsetX,
    offsetZ,
    offsetX + CHUNK_WIDTH,
    offsetZ + CHUNK_WIDTH,
    margin,
  );

  for (const tree of trees) {
    if (!hasCanopy(context, tree.biome)) continue;

    const leaves = context.source.biomes[tree.biome].tree!.leaves!;
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
            hasLeaf(context, tree, x, y, z)
          ) {
            data.set(lx, y, lz, blockParams[leaves].id);
          }
        }
      }
    }
  }

  for (const tree of trees) {
    const lx = tree.x - offsetX;
    const lz = tree.z - offsetZ;
    const log = context.source.biomes[tree.biome].tree!.trunk;

    for (let y = tree.groundY + 1; y <= treeTopY(tree); y++) {
      if (!inLocalBounds(lx, y, lz)) continue;

      const current = data.getId(lx, y, lz);
      if (current === EMPTY_ID || context.source.leafIds.has(current)) {
        data.set(lx, y, lz, blockParams[log].id);
      }
    }
  }
}
