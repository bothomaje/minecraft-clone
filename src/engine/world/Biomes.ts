// import { WorldParams } from './WorldParams';
import { BlockKey } from '../blocks/BlockParams';
import { Box } from './biomeIndex';

export interface Tree {
  trunk: BlockKey;
  leaves: BlockKey | null;
  density: number;
}

export interface Biome {
  where: readonly Box[];
  top: BlockKey;
  filler: BlockKey;
  tree: Tree | null;
}

const SEA: Box = { elevation: [-Infinity, 0] };
const COAST: Box = { elevation: [0, 2] };
const PEAKS: Box = { elevation: [27.5, Infinity] };
const LAND: Box = { elevation: [2, 27.5] };

export const overworldBiomes = {
  ocean: { where: [SEA], top: 'sand', filler: 'sand', tree: null },
  beach: { where: [COAST], top: 'sand', filler: 'sand', tree: null },
  mountains: { where: [PEAKS], top: 'stone', filler: 'stone', tree: null },
  tundra: {
    where: [{ ...LAND, temperature: [-Infinity, -0.3] }],
    top: 'snow',
    filler: 'dirt',
    tree: null,
  },
  plains: {
    where: [
      { ...LAND, temperature: [-0.3, 0.1], humidity: [-Infinity, -0.1] },
      { ...LAND, temperature: [0.1, 0.3], humidity: [-0.3, -0.1] },
    ],
    top: 'grassBlock',
    filler: 'dirt',
    tree: { trunk: 'oakLog', leaves: 'oakLeaves', density: 0.2 },
  },
  forest: {
    where: [
      { ...LAND, temperature: [-0.3, 0.3], humidity: [-0.1, 0.1] },
      { ...LAND, temperature: [-0.3, 0.1], humidity: [0.1, Infinity] },
    ],
    top: 'grassBlock',
    filler: 'dirt',
    tree: { trunk: 'oakLog', leaves: 'oakLeaves', density: 2.5 },
  },
  jungle: {
    where: [
      { ...LAND, temperature: [0.1, Infinity], humidity: [0.1, Infinity] },
    ],
    top: 'grassBlock',
    filler: 'dirt',
    tree: { trunk: 'jungleLog', leaves: 'jungleLeaves', density: 3 },
  },
  desert: {
    where: [
      { ...LAND, temperature: [0.1, Infinity], humidity: [-Infinity, -0.3] },
      { ...LAND, temperature: [0.3, Infinity], humidity: [-Infinity, 0.1] },
    ],
    top: 'sand',
    filler: 'sand',
    tree: { trunk: 'cactus', leaves: null, density: 0.3 },
  },
} satisfies Record<string, Biome>;

export interface Climate {
  temperature: number;
  humidity: number;
}
