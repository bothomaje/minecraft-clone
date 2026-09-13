import { CONFIG } from '../app/config';
import { state } from '../app/state';

export class Hud {
  #lastActiveSlot = state.activeSlot;
  toolbarSlots = [];

  constructor(player) {
    this.player = player;
    this.position = document.getElementById('player-position');
    this.status = document.getElementById('status');
    this.#buildDom();
  }

  update() {
    this.position.innerHTML = state.playerPosition;
    this.status.innerHTML = state.status;
    this.#updateSlots();

    if (state.activeSlot != this.#lastActiveSlot) {
      this.#updateToolbarSelection(state.activeSlot);
      this.#lastActiveSlot = state.activeSlot;
    }
  }

  #buildDom() {
    const toolbarContainer = document.createElement('div');
    toolbarContainer.id = 'toolbar-container';
    document.body.append(toolbarContainer);

    this.toolbar = document.createElement('div');
    this.toolbar.id = 'toolbar';

    for (let i = 0; i < CONFIG.inventory.toolbar; i++) {
      const slot = document.createElement('div');
      slot.className = 'toolbar-slot';
      slot.id = `slot-${i}`;
      this.toolbar.append(slot);
      this.toolbarSlots.push(slot);
    }

    this.toolbarSlots[0].classList.add('selected');
    toolbarContainer.append(this.toolbar);

    this.#updateSlots();
  }

  #updateSlots() {
    for (let i = 0; i < CONFIG.inventory.toolbar; i++) {
      if (this.player.inventory.slots[i]) {
        const counter = `<span class="item-count">${this.player.inventory.slots[i].count}</span>`;
        this.toolbarSlots[i].innerHTML = `
          <img class="toolbar-icon" src="${this.player.inventory.slots[i].item.icon}" />
          ${this.player.inventory.slots[i].count > 1 ? counter : ''}
        `;
      }
    }
  }

  #updateToolbarSelection(slotIndex) {
    this.toolbarSlots[this.#lastActiveSlot].classList.remove('selected');
    this.toolbarSlots[slotIndex].classList.add('selected');
  }
}
