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
  deepslate: 1000,
  ore: 2000,
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
  generateOres(data, context, originX, originZ);
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
      // const deepslateTop = deepslateTopY(context.config.seed, 0, wx, wz);

      for (let y = context.config.minY; y <= height; y++) {
        let block: Block;
        if (y <= bedrockTop) {
          block = blockParams.bedrock;
        } else if (y === height) {
          block = soil.top;
        } else if (y > height - soilDepth) {
          block = soil.filler;
        } else {
          block = isDeepslate(context, wx, y, wz)
            ? blockParams.deepslate
            : blockParams.stone;
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

function isDeepslate(
  context: Context,
  x: number,
  y: number,
  z: number,
): boolean {
  const { enabled, transitionTop, transitionBottom } = context.config.deepslate;
  if (!enabled || y >= transitionTop) return false;
  if (y <= transitionBottom) return true;
  const chance = (transitionTop - y) / (transitionTop - transitionBottom);
  return hashRandom(context.config.seed, x, z, SALT.deepslate + y) < chance;
}

// function deepslateTopY(
//   seed: number,
//   minY: number,
//   x: number,
//   z: number,
// ): number {
//   return minY + Math.round((1 - hashRandom(seed, x, z, SALT.deepslate)) * 10);
// }

// function deepslateOrOre(
//   context: Context,
//   x: number,
//   y: number,
//   z: number,
// ): Block {
//   let block: Block = blockParams.deepslate;
//   for (const ore of Object.values(context.config.ores)) {
//     if (ore.types.includes('deepslate')) {
//       const value = context.noise.noise3d(
//         x / ore.scale.x,
//         y / ore.scale.y,
//         z / ore.scale.z,
//       );
//       if (value > ore.scarcity) block = blockParams[ore.block];
//     }
//   }
//   return block;
// }

function bedrockTopY(seed: number, minY: number, x: number, z: number): number {
  return (
    minY +
    Math.max(Math.round((1 - hashRandom(seed, x, z, SALT.bedrock)) * 10), 5)
  );
}

// function stoneOrOre(context: Context, x: number, y: number, z: number): Block {
//   let block: Block = blockParams.stone;
//   for (const ore of Object.values(context.config.ores)) {
//     if (ore.types.includes('stone')) {
//       const value = context.noise.noise3d(
//         x / ore.scale.x,
//         y / ore.scale.y,
//         z / ore.scale.z,
//       );
//       if (value > ore.scarcity) block = blockParams[ore.block];
//     }
//   }
//   return block;
// }

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

const MAX_VEIN_SIZE = CHUNK_WIDTH; // reach <= 15, so a 3x3 chunk scan is always enough
const FACE_STEPS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
] as const;

function veinRng(seed: number, chunkX: number, chunkZ: number, salt: number) {
  return new RNG((hashRandom(seed, chunkX, chunkZ, salt) * 4294967296) >>> 0);
}

function rollCount(rng: RNG, perChunk: number): number {
  return Math.floor(perChunk) + (rng.random() < perChunk % 1 ? 1 : 0);
}

function rollY(rng: RNG, lo: number, hi: number, distribution: string): number {
  const t =
    distribution === 'triangle'
      ? (rng.random() + rng.random()) / 2
      : rng.random();
  return lo + Math.floor(t * (hi - lo + 1));
}

/** Grows a blob by repeatedly attaching a random face-neighbour to a random existing cell. */
function growVein(
  rng: RNG,
  cells: Int32Array,
  ax: number,
  ay: number,
  az: number,
  size: number,
): number {
  cells[0] = ax;
  cells[1] = ay;
  cells[2] = az;
  let count = 1;
  for (let tries = 0; count < size && tries < size * 6; tries++) {
    const base = Math.floor(rng.random() * count) * 3;
    const step = FACE_STEPS[Math.floor(rng.random() * 6)];
    const x = cells[base] + step[0];
    const y = cells[base + 1] + step[1];
    const z = cells[base + 2] + step[2];

    let exists = false;
    for (let c = 0; c < count; c++) {
      if (
        cells[c * 3] === x &&
        cells[c * 3 + 1] === y &&
        cells[c * 3 + 2] === z
      ) {
        exists = true;
        break;
      }
    }
    if (exists) continue;

    cells[count * 3] = x;
    cells[count * 3 + 1] = y;
    cells[count * 3 + 2] = z;
    count++;
  }
  return count;
}

function generateOres(
  data: ChunkData,
  context: Context,
  originX: number,
  originZ: number,
) {
  const { config } = context;
  const chunkX = originX / CHUNK_WIDTH;
  const chunkZ = originZ / CHUNK_WIDTH;
  const stoneId = blockParams.stone.id;
  const deepslateId = blockParams.deepslate.id;
  const andesiteId = blockParams.andesite.id;
  const dioriteId = blockParams.diorite.id;
  const graniteId = blockParams.granite.id;
  const tuffId = blockParams.tuff.id;
  const cells = new Int32Array(MAX_VEIN_SIZE * 3);

  let oreIndex = 0;
  for (const ore of Object.values(config.ores)) {
    const salt = SALT.ore + oreIndex++ * 1024;
    const lo = Math.max(ore.minY, config.minY);
    const hi = Math.min(ore.maxY, config.maxY - 1);
    if (hi < lo) continue;

    // Clamp here so dragging GUI sliders can never produce invalid sizes
    const sizeA = Math.min(Math.max(ore.veinSize.min, 1), MAX_VEIN_SIZE);
    const sizeB = Math.min(Math.max(ore.veinSize.max, 1), MAX_VEIN_SIZE);
    const sizeMin = Math.min(sizeA, sizeB);
    const sizeMax = Math.max(sizeA, sizeB);

    const normalId = blockParams[ore.block].id;
    const deepId = blockParams[ore.deepslateBlock ?? ore.block].id;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const nx = chunkX + dx;
        const nz = chunkZ + dz;
        const attempts = rollCount(
          veinRng(config.seed, nx, nz, salt + 1023),
          ore.veinsPerChunk,
        );

        for (let i = 0; i < attempts; i++) {
          const rng = veinRng(config.seed, nx, nz, salt + i);
          const ax = nx * CHUNK_WIDTH + Math.floor(rng.random() * CHUNK_WIDTH);
          const az = nz * CHUNK_WIDTH + Math.floor(rng.random() * CHUNK_WIDTH);
          const ay = rollY(rng, lo, hi, ore.distribution);
          const size =
            sizeMin + Math.floor(rng.random() * (sizeMax - sizeMin + 1));

          // Too far from this chunk to touch it
          if (
            ax + sizeMax < originX ||
            ax - sizeMax > originX + CHUNK_WIDTH - 1 ||
            az + sizeMax < originZ ||
            az - sizeMax > originZ + CHUNK_WIDTH - 1
          )
            continue;

          const count = growVein(rng, cells, ax, ay, az, size);
          for (let c = 0; c < count; c++) {
            const lx = cells[c * 3] - originX;
            const y = cells[c * 3 + 1];
            const lz = cells[c * 3 + 2] - originZ;
            if (y < lo || y > hi || !inLocalBounds(lx, y, lz)) continue;

            const host = data.getId(lx, y, lz);
            const stoneReplacement =
              host === stoneId ||
              host === andesiteId ||
              host === dioriteId ||
              host === graniteId;
            const deepslateReplacement =
              host === deepslateId || host === tuffId;
            if (stoneReplacement) data.set(lx, y, lz, normalId);
            else if (deepslateReplacement) data.set(lx, y, lz, deepId);
          }
        }
      }
    }
  }
}
