import { state } from '../app/state';

export class Hud {
  #lastActiveBlockId = null;

  constructor() {
    this.position = document.getElementById('player-position');
    this.status = document.getElementById('status');
  }

  update() {
    this.position.innerHTML = state.playerPosition;
    this.status.innerHTML = state.status;

    if (state.activeBlockId != this.#lastActiveBlockId) {
      this.#updateToolbarSelection(state.activeBlockId);
      this.#lastActiveBlockId = state.activeBlockId;
    }
  }

  #updateToolbarSelection(activeBlockId) {
    document.querySelectorAll('.toolbar-icon.selected').forEach((icon) => {
      icon.classList.remove('selected');
    });
    document
      .getElementById(`toolbar-${activeBlockId}`)
      .classList.add('selected');
  }
}
