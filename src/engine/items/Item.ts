import { Block } from '../blocks/BlockParams';

export interface Item {
  id: number;
  name: string;
  maxStackSize: number;
  icon: string;
  durability?: number;
  placementBlock?: Block;
}

export const createItem = (
  id: number,
  name: string,
  icon = '',
  placementBlock = undefined,
  maxStackSize = 64,
  durability = undefined,
): Item => ({
  id,
  name,
  maxStackSize,
  icon,
  durability,
  placementBlock,
});
