import { Item } from './Item';
import { ItemStack } from './ItemStack';

export const items = {
  dirt: new Item({
    id: 3,
    name: 'dirt',
    icon: '/textures/block/dirt.png',
  }),
  cobblestone: new Item({
    id: 4,
    name: 'cobblestone',
    icon: '/textures/block/cobblestone.png',
  }),
  sand: new Item({
    id: 12,
    name: 'sand',
    icon: '/textures/block/sand.png',
  }),
  ironOre: new Item({
    id: 15,
    name: 'iron_ore',
    icon: '/textures/block/iron_ore.png',
  }),
  oakLog: new Item({
    id: 17,
    name: 'oak_log',
    icon: '/textures/block/oak_log.png',
  }),
  oakLeaves: new Item({
    id: 18,
    name: 'oak_leaves',
    icon: '/textures/block/oak_leaves.png',
  }),
  snow: new Item({
    id: 80,
    name: 'snow',
    icon: '/textures/block/snow.png',
  }),
  cactus: new Item({
    id: 81,
    name: 'cactus',
    icon: '/textures/block/cactus_side.png',
  }),
  coal: new Item({
    id: 302,
    name: 'coal',
    icon: '/textures/item/coal.png',
  }),
  jungleLog: new Item({
    id: 571,
    name: 'jungle_log',
    icon: '/textures/block/jungle_log.png',
  }),
  jungleLeaves: new Item({
    id: 572,
    name: 'jungle_leaves',
    icon: '/textures/block/jungle_leaves.png',
  }),
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
