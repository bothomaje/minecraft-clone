// import { WorldParams } from './WorldParams';
import { BlockKey } from '../blocks/BlockParams';
import { Box } from './biomeIndex';

export interface Tree {
  trunk: BlockKey;
  leaves: BlockKey | null;
  density: number;
}

export interface BiomeColour {
  /** Colormap lookup inputs, 0..1. Unrelated to the `where` climate axes above. */
  temperature: number;
  downfall: number;
  /** Fixed 0xRRGGBB colours. When set, the colormap lookup is skipped. */
  grass?: number;
  foliage?: number;
  dryFoliage?: number;
}

export interface Biome {
  where: readonly Box[];
  top: BlockKey;
  filler: BlockKey;
  tree: Tree | null;
  colour: BiomeColour;
}

const SEA: Box = { elevation: [-Infinity, 0] };
const COAST: Box = { elevation: [0, 2] };
const PEAKS: Box = { elevation: [27.5, Infinity] };
const LAND: Box = { elevation: [2, 27.5] };

export const overworldBiomes = {
  ocean: {
    where: [SEA],
    top: 'sand',
    filler: 'sand',
    tree: null,
    colour: { temperature: 0.5, downfall: 0.5 },
  },
  beach: {
    where: [COAST],
    top: 'sand',
    filler: 'sand',
    tree: null,
    colour: { temperature: 0.8, downfall: 0.4 },
  },
  mountains: {
    where: [PEAKS],
    top: 'stone',
    filler: 'stone',
    tree: null,
    colour: { temperature: 0.2, downfall: 0.3 },
  },
  tundra: {
    where: [{ ...LAND, temperature: [-Infinity, -0.3] }],
    top: 'snow',
    filler: 'dirt',
    tree: null,
    colour: { temperature: 0.0, downfall: 0.5 },
  },
  plains: {
    where: [
      { ...LAND, temperature: [-0.3, 0.1], humidity: [-Infinity, -0.1] },
      { ...LAND, temperature: [0.1, 0.3], humidity: [-0.3, -0.1] },
    ],
    top: 'grassBlock',
    filler: 'dirt',
    tree: { trunk: 'oakLog', leaves: 'oakLeaves', density: 0.2 },
    colour: { temperature: 0.8, downfall: 0.4 },
  },
  forest: {
    where: [
      { ...LAND, temperature: [-0.3, 0.3], humidity: [-0.1, 0.1] },
      { ...LAND, temperature: [-0.3, 0.1], humidity: [0.1, Infinity] },
    ],
    top: 'grassBlock',
    filler: 'dirt',
    tree: { trunk: 'oakLog', leaves: 'oakLeaves', density: 2.5 },
    colour: { temperature: 0.7, downfall: 0.8 },
  },
  jungle: {
    where: [
      { ...LAND, temperature: [0.1, Infinity], humidity: [0.1, Infinity] },
    ],
    top: 'grassBlock',
    filler: 'dirt',
    tree: { trunk: 'jungleLog', leaves: 'jungleLeaves', density: 3 },
    colour: { temperature: 0.95, downfall: 0.9 },
  },
  desert: {
    where: [
      { ...LAND, temperature: [0.1, Infinity], humidity: [-Infinity, -0.3] },
      { ...LAND, temperature: [0.3, Infinity], humidity: [-Infinity, 0.1] },
    ],
    top: 'sand',
    filler: 'sand',
    tree: { trunk: 'cactus', leaves: null, density: 0.3 },
    colour: { temperature: 1.0, downfall: 0.0 },
  },
} satisfies Record<string, Biome>;

export interface Climate {
  temperature: number;
  humidity: number;
}
