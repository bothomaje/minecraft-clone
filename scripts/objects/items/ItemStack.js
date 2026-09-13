/**
 * Represents a stack of a given item.
 */
export class ItemStack {
  constructor(item, count = 1) {
    this.item = item;
    this.count = count;
  }

  get isEmpty() {
    return !this.item || this.count <= 0;
  }

  get isFull() {
    return this.count >= this.item.maxStackSize;
  }

  /**
   * Checks if another stack holds the same item and has room.
   * @param {ItemStack} other
   */
  canStackWith(other) {
    return !!other && other.item.id === this.item.id && !this.isFull;
  }

  /**
   * Removes `amount` from this stack and returns it as a new stack.
   * @param {number} amount
   */
  split(amount) {
    const taken = Math.min(amount, this.count);
    this.count -= taken;
    return new ItemStack(this.item, taken);
  }

  clone() {
    return new ItemStack(this.item, this.count);
  }
}
