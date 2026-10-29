import { items } from '../items/ItemRegistry';
import { assertValidSchema } from '../../engine/blocks/BlockState';
import { blockParams } from '../../engine/blocks/BlockParams';

export const blocks = blockParams;

for (const block of Object.values(blockParams)) {
  if (block.stateSchema) assertValidSchema(block.name, block.stateSchema);
}

export const blocksById = new Map(
  Object.values(blocks).map((block) => [block.id, block]),
);

export const placeableBlockByItem = new Map([
  [items.dirt, blockParams.dirt],
  [items.cobblestone, blockParams.cobblestone],
  [items.sand, blockParams.sand],
  [items.ironOre, blockParams.ironOre],
  [items.oakLog, blockParams.oakLog],
  [items.oakLeaves, blockParams.oakLeaves],
  [items.snow, blockParams.snow],
  [items.cactus, blockParams.cactus],
  [items.jungleLog, blockParams.jungleLog],
  [items.jungleLeaves, blockParams.jungleLeaves],
  [items.deepslate, blockParams.deepslate],
]);
