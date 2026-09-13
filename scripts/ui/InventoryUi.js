const HOTBAR_SIZE = 9;
const MAIN_SIZE = 27;

export class InventoryUi {
  open = false;
  cursorStack = null;

  constructor(player) {
    this.player = player;
    this.#buildDom();

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') this.toggle();
    });
    document.addEventListener('mousemove', (e) => {
      this.cursorEl.style.left = `${e.clientX}px`;
      this.cursorEl.style.top = `${e.clientY}px`;
    });
  }

  toggle() {
    this.open = !this.open;
    this.overlayEl.style.display = this.open ? 'flex' : 'none';

    if (this.open) {
      this.player.controls.unlock();
    } else if (this.cursorStack) {
      const leftover = this.player.inventory.addItem(this.cursorStack);
      if (leftover > 0) {
        console.log(
          `Dropped ${leftover}x ${this.cursorStack.item.name} closing inventory`,
        );
      }
      this.cursorStack = null;
    }
  }

  /**
   * Called every frame to refresh the overlay's slot contents.
   * The hotbar itself is rendered by Hud, not here.
   */
  update() {
    if (!this.open) return;

    for (let i = 0; i < MAIN_SIZE; i++) {
      this.#renderSlot(
        this.mainSlotEls[i],
        this.player.inventory.getSlot(HOTBAR_SIZE + i),
      );
    }

    this.cursorEl.style.display = this.cursorStack ? 'flex' : 'none';
    if (this.cursorStack) {
      this.cursorEl.innerHTML = `
        <img class="toolbar-icon" src="${this.cursorStack.item.icon}" />
        <span class="item-count">${this.cursorStack.count}</span>
      `;
    }
  }

  #renderSlot(el, stack) {
    el.innerHTML = stack
      ? `
        <img class="toolbar-icon" src="${stack.item.icon}" />
        ${stack.count > 1 ? `<span class="item-count">${stack.count}</span>` : ''}
      `
      : '';
  }

  #handleSlotClick(absoluteIndex) {
    const inventory = this.player.inventory;
    const slotStack = inventory.getSlot(absoluteIndex);

    if (!this.cursorStack) {
      if (!slotStack) return;
      this.cursorStack = slotStack;
      inventory.setSlot(absoluteIndex, null);
      return;
    }

    if (!slotStack) {
      inventory.setSlot(absoluteIndex, this.cursorStack);
      this.cursorStack = null;
      return;
    }

    if (slotStack.item.id === this.cursorStack.item.id) {
      const space = slotStack.item.maxStackSize - slotStack.count;
      const moved = Math.min(space, this.cursorStack.count);
      slotStack.count += moved;
      this.cursorStack.count -= moved;
      if (this.cursorStack.count <= 0) this.cursorStack = null;
      return;
    }

    inventory.setSlot(absoluteIndex, this.cursorStack);
    this.cursorStack = slotStack;
  }

  #buildDom() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'inventory-overlay';
    this.overlayEl.style.display = 'none';

    const craftingEl = document.createElement('div');
    craftingEl.id = 'crafting-placeholder';
    craftingEl.textContent = '2x2 crafting — coming soon';
    this.overlayEl.append(craftingEl);

    const mainGridEl = document.createElement('div');
    mainGridEl.id = 'inventory-grid';
    this.mainSlotEls = this.#buildSlotRow(mainGridEl, MAIN_SIZE, HOTBAR_SIZE);
    this.overlayEl.append(mainGridEl);

    document.body.append(this.overlayEl);

    this.cursorEl = document.createElement('div');
    this.cursorEl.id = 'inventory-cursor';
    this.cursorEl.className = 'toolbar-slot';
    this.cursorEl.style.display = 'none';
    document.body.append(this.cursorEl);
  }

  #buildSlotRow(container, count, offset) {
    const slotEls = [];
    for (let i = 0; i < count; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'toolbar-slot';
      slotEl.id = `inventory-slot-${offset + i}`;
      slotEl.addEventListener('click', () => this.#handleSlotClick(offset + i));
      container.append(slotEl);
      slotEls.push(slotEl);
    }
    return slotEls;
  }
}
