/**
 * Represents an item definition (not an instance in an inventory).
 */
export class Item {
  constructor(id, name, maxStackSize = 64, icon = null, durability = null) {
    this.id = id;
    this.name = name;
    this.maxStackSize = maxStackSize;
    this.icon = icon;
    this.durability = durability;
  }
}
