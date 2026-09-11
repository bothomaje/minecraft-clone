import { CONFIG } from '../app/config';
import { state } from '../app/state';
import { blocks } from '../blocks';

export class InputSystem {
  constructor(player) {
    this.player = player;
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  /**
   * Event handler for 'keydown' event
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    if (!this.player.controls.isLocked) {
      this.player.controls.lock();
    }

    switch (event.code) {
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
        document
          .getElementById(`toolbar-${state.activeBlockId}`)
          .classList.remove('selected');
        state.activeBlockId = CONFIG.toolbar.slots[Number(event.key)];
        document
          .getElementById(`toolbar-${state.activeBlockId}`)
          .classList.add('selected');
        this.player.tool.visible = state.activeBlockId === blocks.empty.id;
        break;
      case 'KeyW':
        this.player.input.z = this.player.maxSpeed;
        break;
      case 'KeyA':
        this.player.input.x = -this.player.maxSpeed;
        break;
      case 'KeyS':
        this.player.input.z = -this.player.maxSpeed;
        break;
      case 'KeyD':
        this.player.input.x = this.player.maxSpeed;
        break;
      case 'Space':
        if (this.player.onGround) {
          this.player.velocity.y += this.player.jumpSpeed;
        }
        break;
    }
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.player.input.z = 0;
        break;
      case 'KeyA':
        this.player.input.x = 0;
        break;
      case 'KeyS':
        this.player.input.z = 0;
        break;
      case 'KeyD':
        this.player.input.x = 0;
        break;
      case 'KeyR':
        this.player.position.copy(CONFIG.player.position);
        this.player.velocity.set(0, 0, 0);
        break;
    }
  }
}
