import { Block } from '../blocks/BlockParams';
import { createItem, Item } from './Item';
import { ItemStack } from './ItemStack';

export const items: Record<string, Item> = {
  dirt: createItem(3, 'dirt', '/textures/block/dirt.png'),
  cobblestone: createItem(4, 'cobblestone', 'textures/block/cobblestone.png'),
  sand: createItem(12, 'sand', '/textures/block/sand.png'),
  ironOre: createItem(15, 'iron_ore', '/textures/block/iron_ore.png'),
  oakLog: createItem(17, 'oak_log', '/textures/block/oak_log.png'),
  oakLeaves: createItem(18, 'oak_leaves', '/textures/block/oak_leaves.png'),
  snow: createItem(80, 'snow', '/textures/block/snow.png'),
  cactus: createItem(81, 'cactus', '/textures/block/cactus_side.png'),
  coal: createItem(302, 'coal', '/textures/item/coal.png'),
  jungleLog: createItem(571, 'jungle_log', '/textures/block/jungle_log.png'),
  jungleLeaves: createItem(
    1057,
    'jungle_leaves',
    '/textures/block/jungle_leaves.png',
  ),
  deepslate: createItem(633, 'deepslate', '/textures/block/deepslate.png'),
};

export const itemsById = new Map(
  Object.values(items).map((item) => [item.id, item]),
);

/**
 * Rolls a block's drop table into ItemStacks.
 * @param {object} block Block definition with a `drops` array.
 * @returns {ItemStack[]}
 */
export function rollBlockDrops(block: Block) {
  if (!block?.drops?.length) return [];

  const stacks = [];
  for (const drop of block.drops) {
    if (Math.random() > (drop.chance ?? 1)) continue;
    const item = items[drop.item as keyof typeof items];
    if (!item) continue;
    const count =
      typeof drop.count === 'object'
        ? drop.count.min +
          Math.floor(Math.random() * (drop.count.max - drop.count.min + 1))
        : (drop.count ?? 1);
    stacks.push(new ItemStack(item, count));
  }
  return stacks;
}
