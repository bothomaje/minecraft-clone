import { state } from '../app/state';
import { blocks } from '../objects/blocks/blocksRegistry';

export class InteractionSystem {
  constructor(player, world) {
    this.player = player;
    this.world = world;

    document.addEventListener('mousedown', this.onMouseDown.bind(this));
  }

  onMouseDown() {
    if (this.player.controls.isLocked && this.player.selectedCoords) {
      if (state.activeBlockId === blocks.empty.id) {
        this.world.removeBlock(
          this.player.selectedCoords.x,
          this.player.selectedCoords.y,
          this.player.selectedCoords.z,
        );
        this.player.tool.startAnimation();
      } else {
        this.world.addBlock(
          this.player.selectedCoords.x,
          this.player.selectedCoords.y,
          this.player.selectedCoords.z,
          state.activeBlockId,
        );
      }
    }
  }
}
