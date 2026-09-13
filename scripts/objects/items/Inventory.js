import { ItemStack } from './ItemStack';

const HOTBAR_SIZE = 9;
const MAIN_SIZE = 27;
const TOTAL_SLOTS = HOTBAR_SIZE + MAIN_SIZE;

export class Inventory {
  slots = new Array(TOTAL_SLOTS).fill(null);
  selectedSlot = 0;

  getSlot(index) {
    return this.slots[index] ?? null;
  }

  setSlot(index, stack) {
    this.slots[index] = stack && !stack.isEmpty ? stack : null;
  }

  countItem(item) {
    return this.slots.reduce(
      (total, stack) => total + (stack?.item.id === item.id ? stack.count : 0),
      0,
    );
  }

  hasItem(item, count = 1) {
    return this.countItem(item) >= count;
  }

  /**
   * Adds a stack, merging into existing stacks first then filling empty slots.
   * @param {ItemStack} stack
   * @returns {number} leftover count that didn't fit
   */
  addItem(stack) {
    let remaining = stack.count;

    for (const existing of this.slots) {
      if (remaining <= 0) break;
      if (existing?.item.id === stack.item.id && !existing.isFull) {
        const space = existing.item.maxStackSize - existing.count;
        const added = Math.min(space, remaining);
        existing.count += added;
        remaining -= added;
      }
    }

    for (let i = 0; i < this.slots.length; i++) {
      if (remaining <= 0) break;
      if (this.slots[i] === null) {
        const count = Math.min(remaining, stack.item.maxStackSize);
        this.slots[i] = new ItemStack(stack.item, count);
        remaining -= count;
      }
    }

    return remaining;
  }

  /**
   * Removes up to `count` of an item across slots.
   * @returns {number} amount actually removed
   */
  removeItem(item, count = 1) {
    let remaining = count;

    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const stack = this.slots[i];
      if (stack?.item.id === item.id) {
        const removed = Math.min(stack.count, remaining);
        stack.count -= removed;
        remaining -= removed;
        if (stack.count <= 0) this.slots[i] = null;
      }
    }

    return count - remaining;
  }

  mergeStacks(fromIndex, toIndex) {
    const from = this.slots[fromIndex];
    const to = this.slots[toIndex];
    if (!from || !to || !to.canStackWith(from)) return;

    const space = to.item.maxStackSize - to.count;
    const moved = Math.min(space, from.count);
    to.count += moved;
    from.count -= moved;
    if (from.count <= 0) this.slots[fromIndex] = null;
  }

  splitStack(index, amount) {
    const stack = this.slots[index];
    if (!stack) return null;

    const split = stack.split(amount);
    if (stack.count <= 0) this.slots[index] = null;

    const emptyIndex = this.slots.findIndex((s) => s === null);
    if (emptyIndex !== -1) this.slots[emptyIndex] = split;
    return split;
  }

  swapStacks(indexA, indexB) {
    [this.slots[indexA], this.slots[indexB]] = [
      this.slots[indexB],
      this.slots[indexA],
    ];
  }
}
