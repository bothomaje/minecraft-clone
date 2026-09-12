import { state } from '../app/state';

export class Hud {
  #lastActiveSlot = null;

  constructor() {
    this.position = document.getElementById('player-position');
    this.status = document.getElementById('status');
  }

  update() {
    this.position.innerHTML = state.playerPosition;
    this.status.innerHTML = state.status;

    if (state.activeSlot != this.#lastActiveSlot) {
      this.#updateToolbarSelection(state.activeSlot);
      this.#lastActiveSlot = state.activeSlot;
    }
  }

  #updateToolbarSelection(slotIndex) {
    document.querySelectorAll('.toolbar-icon.selected').forEach((icon) => {
      icon.classList.remove('selected');
    });
    document.getElementById(`toolbar-${slotIndex}`).classList.add('selected');
  }
}
