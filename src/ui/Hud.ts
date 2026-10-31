import { CONFIG } from '../core/Config';
import { state } from '../app/state';
import { Player } from '../engine/entities/Player';

export class Hud {
  private lastActiveSlot = state.activeSlot;
  toolbarSlots: HTMLElement[] = [];
  player: Player;
  position: HTMLElement | null;
  status: HTMLElement | null;
  toolbar: HTMLElement = document.createElement('div');

  constructor(player: Player) {
    this.player = player;
    this.position = document.getElementById('player-position');
    this.status = document.getElementById('status');
    this.buildDom();
  }

  update() {
    if (!this.position || !this.status) return;

    this.position.innerHTML = state.playerPosition;
    this.status.innerHTML = state.status;
    this.updateSlots();

    if (state.activeSlot != this.lastActiveSlot) {
      this.updateToolbarSelection(state.activeSlot);
      this.lastActiveSlot = state.activeSlot;
    }
  }

  private buildDom() {
    const toolbarContainer = document.createElement('div');
    toolbarContainer.id = 'toolbar-container';
    document.body.append(toolbarContainer);

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

    this.updateSlots();
  }

  private updateSlots() {
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

  private updateToolbarSelection(slotIndex: number) {
    this.toolbarSlots[this.lastActiveSlot].classList.remove('selected');
    this.toolbarSlots[slotIndex].classList.add('selected');
  }
}
