import { Item } from './Item';

/**
 * Represents a stack of a given item.
 */
export class ItemStack {
  item: Item;
  count: number;

  constructor(item: Item, count = 1) {
    this.item = item;
    this.count = count;
  }

  get isEmpty(): boolean {
    return !this.item || this.count <= 0;
  }

  get isFull(): boolean {
    return this.count >= this.item.maxStackSize;
  }

  /**
   * Checks if another stack holds the same item and has room.
   * @param {ItemStack} other
   */
  canStackWith(other: ItemStack): boolean {
    return !!other && other.item.id === this.item.id && !this.isFull;
  }

  /**
   * Removes `amount` from this stack and returns it as a new stack.
   * @param {number} amount
   */
  split(amount: number): ItemStack {
    const taken = Math.min(amount, this.count);
    this.count -= taken;
    return new ItemStack(this.item, taken);
  }

  clone(): ItemStack {
    return new ItemStack(this.item, this.count);
  }
}
