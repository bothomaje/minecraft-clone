import { Item } from './Item';
import { ItemStack } from './ItemStack';

const itemIcons = {
  dirt: null,
  cobblestone: null,
  sand: null,
  ironOre: null,
  oakLog: null,
  oakLeaves: null,
  snow: null,
  cactus: null,
  coal: null,
  jungleLog: null,
  jungleLeaves: null,
};

export const items = {
  dirt: new Item(3, 'dirt', itemIcons.dirt),
  cobblestone: new Item(4, 'cobblestone', itemIcons.cobblestone),
  sand: new Item(12, 'sand', itemIcons.sand),
  ironOre: new Item(15, 'iron_ore', itemIcons.ironOre),
  oakLog: new Item(17, 'oak_log', itemIcons.oakLog),
  oakLeaves: new Item(18, 'oak_leaves', itemIcons.oakLeaves),
  snow: new Item(80, 'snow', itemIcons.snow),
  cactus: new Item(81, 'cactus', itemIcons.cactus),
  coal: new Item(302, 'coal', itemIcons.coal),
  jungleLog: new Item(571, 'jungle_log', itemIcons.jungleLog),
  jungleLeaves: new Item(572, 'jungle_leaves', itemIcons.jungleLeaves),
};

export const itemsById = new Map(
  Object.values(items).map((item) => [item.id, item]),
);

/**
 * Rolls a block's drop table into ItemStacks.
 * @param {object} block Block definition with a `drops` array.
 * @returns {ItemStack[]}
 */
export function rollBlockDrops(block) {
  if (!block?.drops?.length) return [];

  const stacks = [];
  for (const drop of block.drops) {
    if (Math.random() > (drop.chance ?? 1)) continue;
    stacks.push(new ItemStack(drop.item, drop.count ?? 1));
  }
  return stacks;
}
