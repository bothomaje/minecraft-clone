import { StateSchema } from './blockState';

export const BlockCategory = {
  SOLID: 'solid',
  TRANSPARENT: 'transparent',
  CUTOUT: 'cutout',
  LIQUID: 'liquid',
  NON_SOLID: 'non_solid',
} as const;
export type BlockCategory = (typeof BlockCategory)[keyof typeof BlockCategory];

export interface Drop {
  item: string;
  count: number;
  chance?: number;
}

export interface SoundSet {
  place: string;
  break: string;
  broken: string;
}

export interface Block {
  id: number;
  name: string;
  category: BlockCategory;
  solid: boolean;
  opaque: boolean;
  hardness: number;
  gravity?: boolean;
  requiredTool?: string;
  stateSchema?: StateSchema;
  sounds?: SoundSet;
  drops: readonly Drop[];
}

const soundSet = (blockName: string) => ({
  place: `sounds/block/${blockName}/place.ogg`,
  break: `sounds/block/${blockName}/break.ogg`,
  broken: `sounds/block/${blockName}/broken.ogg`,
});

const sounds = {
  dirt: soundSet('dirt'),
  grass: soundSet('grass'),
  sand: soundSet('sand'),
  snow: soundSet('snow'),
  stone: soundSet('stone'),
  wood: soundSet('wood'),
  wool: soundSet('wool'),
};

export const blockParams = {
  empty: {
    id: 0,
    name: 'empty',
    category: BlockCategory.NON_SOLID,
    solid: false,
    opaque: false,
    hardness: 0,
    drops: [],
  },
  stone: {
    id: 1,
    name: 'stone',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 1.5,
    gravity: false,
    requiredTool: 'pickaxe',
    sounds: sounds.stone,
    drops: [{ item: 'cobblestone', count: 1 }],
  },
  grassBlock: {
    id: 2,
    name: 'grass_block',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.6,
    gravity: false,
    sounds: sounds.grass,
    drops: [{ item: 'dirt', count: 1 }],
  },
  dirt: {
    id: 3,
    name: 'dirt',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.5,
    gravity: false,
    sounds: sounds.dirt,
    drops: [{ item: 'dirt', count: 1 }],
  },
  cobblestone: {
    id: 4,
    name: 'cobblestone',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 1.5,
    gravity: false,
    requiredTool: 'pickaxe',
    sounds: sounds.stone,
    drops: [{ item: 'cobblestone', count: 1 }],
  },
  bedrock: {
    id: 7,
    name: 'bedrock',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: -1,
    sounds: sounds.stone,
    drops: [],
  },
  cloud: {
    id: 9,
    name: 'cloud',
    category: BlockCategory.NON_SOLID,
    solid: false,
    opaque: false,
    hardness: 0,
    drops: [],
  },
  sand: {
    id: 12,
    name: 'sand',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.5,
    gravity: true,
    sounds: sounds.sand,
    drops: [{ item: 'sand', count: 1 }],
  },
  ironOre: {
    id: 15,
    name: 'iron_ore',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 3,
    requiredTool: 'stonePickaxe',
    sounds: sounds.stone,
    drops: [{ item: 'ironOre', count: 1 }],
  },
  coalOre: {
    id: 16,
    name: 'coal_ore',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 3,
    requiredTool: 'pickaxe',
    sounds: sounds.stone,
    drops: [{ item: 'coal', count: 1 }],
  },
  oakLog: {
    id: 17,
    name: 'oak_log',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 2,
    stateSchema: { axis: ['y', 'x', 'z'] },
    sounds: sounds.wood,
    drops: [{ item: 'oakLog', count: 1 }],
  },
  oakLeaves: {
    id: 18,
    name: 'oak_leaves',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: false,
    hardness: 0.2,
    sounds: sounds.grass,
    drops: [{ item: 'oakLeaves', count: 1, chance: 0.05 }],
  },
  snow: {
    id: 80,
    name: 'snow',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.2,
    sounds: sounds.snow,
    drops: [{ item: 'snow', count: 1 }],
  },
  cactus: {
    id: 81,
    name: 'cactus',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 0.4,
    sounds: sounds.wool,
    drops: [{ item: 'cactus', count: 1 }],
  },
  jungleLog: {
    id: 571,
    name: 'jungle_log',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: true,
    hardness: 2,
    stateSchema: { axis: ['y', 'x', 'z'] },
    sounds: sounds.wood,
    drops: [{ item: 'jungleLog', count: 1 }],
  },
  jungleLeaves: {
    id: 572,
    name: 'jungle_leaves',
    category: BlockCategory.SOLID,
    solid: true,
    opaque: false,
    hardness: 0.2,
    sounds: sounds.grass,
    drops: [{ item: 'jungleLeaves', count: 1, chance: 0.05 }],
  },
} satisfies Record<string, Block>;

export type BlockKey = keyof typeof blockParams;
