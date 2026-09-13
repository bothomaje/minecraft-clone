import { CONFIG } from '../../app/config';
import { state } from '../../app/state';
import { blocks, blocksById } from '../../objects/blocks/blocksRegistry';
import { Raycaster } from './Raycaster';

export class InteractionSystem {
  raycaster = new Raycaster();
  hit = null;
  mining = null;
  mouseDown = false;

  static blockKey(pos) {
    return `${pos.x},${pos.y},${pos.z}`;
  }

  constructor(player, world, sounds) {
    this.player = player;
    this.world = world;
    this.sounds = sounds;

    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  /**
   * Updates interaction state
   * @param {number} dt
   */
  update(dt) {
    this.hit = this.player.controls.isLocked
      ? this.raycaster.cast(this.world, this.player.camera)
      : null;

    if (!this.hit) {
      this.player.hideSelection();
      this.cancelMining();
      return;
    }

    if (state.activeBlock === blocks.empty) {
      this.updateBreaking(dt);
    } else {
      this.cancelMining();
      this.updatePlacementPreview();
    }
  }

  onMouseDown() {
    if (!this.player.controls.isLocked) return;

    this.mouseDown = true;

    if (state.activeBlock !== blocks.empty) {
      this.tryPlaceBlock();
    }
  }

  onMouseUp() {
    this.mouseDown = false;
    this.cancelMining();
  }

  updateBreaking(dt) {
    const pos = this.hit.blockPosition;

    if (this.mouseDown) {
      const key = InteractionSystem.blockKey(pos);

      if (!this.mining || this.mining.key !== key) {
        this.startMining(pos, key);
      }

      if (this.mining) {
        this.mining.elapsed += dt;
        const progress = Math.min(
          this.mining.elapsed / this.mining.requiredTime,
          1,
        );

        if (
          this.mining.elapsed - this.mining.lastSoundTick >=
          CONFIG.mining.soundTickInterval
        ) {
          this.sounds?.play(this.mining.blockType, 'break');
          this.player.tool.startAnimation();
          this.mining.lastSoundTick = this.mining.elapsed;
        }

        this.player.showSelection(
          pos,
          CONFIG.player.selectionHelper.material.color,
          1,
        );

        const stage = Math.floor(progress * CONFIG.mining.stages);
        this.player.showCrack(pos, stage);

        if (progress >= 1) {
          this.finishMining();
        }

        return;
      }
    } else {
      this.cancelMining();
    }

    this.player.showSelection(
      pos,
      CONFIG.player.selectionHelper.material.color,
      1,
    );
  }

  startMining(position, key) {
    const block = this.world.getBlock(position.x, position.y, position.z);
    const blockType = block && blocksById.get(block.id);

    if (!blockType) {
      this.mining = null;
      return;
    }

    this.mining = {
      key,
      position: position.clone(),
      blockType,
      elapsed: 0,
      requiredTime: this.getMiningTime(blockType),
      lastSoundTick: 0,
    };
  }

  finishMining() {
    const { position, blockType } = this.mining;

    this.world.removeBlock(position.x, position.y, position.z);
    this.player.tool.startAnimation();
    this.handleDrops(blockType);
    this.sounds?.play(blockType, 'broken');
    this.player.hideCrack();
    this.mining = null;
  }

  cancelMining() {
    this.mining = null;
    this.player.hideCrack();
  }

  getMiningTime(block) {
    const hasCorrectTool =
      !block.requiredTool || block.requiredTool === this.player.tool.type;
    const multiplier = hasCorrectTool
      ? CONFIG.mining.correctToolMultiplier
      : CONFIG.mining.wrongToolMultiplier;

    return (block.hardness * CONFIG.mining.secondsPerHardness) / multiplier;
  }

  handleDrops(block) {
    if (block.drops === null || block.drops === undefined) return;

    const dropType = blocksById.get(block.drops);
    console.log(`Picked up: ${dropType?.name ?? block.drops}`);
  }

  updatePlacementPreview() {
    const placementPos = this.hit.placementPosition;

    if (this.overlapsPlayer(placementPos)) {
      this.player.hideSelection();
      return;
    }

    this.player.showSelection(placementPos, CONFIG.player.placement, 1);
  }

  tryPlaceBlock() {
    if (!this.hit) return;

    const placementPos = this.hit.placementPosition;
    if (this.overlapsPlayer(placementPos)) return;

    const placementState = this.getPlacementState(
      state.activeBlock,
      this.hit.normal,
    );

    this.world.addBlock(
      placementPos.x,
      placementPos.y,
      placementPos.z,
      state.activeBlock,
      placementState,
    );

    this.sounds?.play(state.activeBlock, 'place');
  }

  getPlacementState(block, normal) {
    if (!block?.state) return undefined;

    if ('axis' in block.state) {
      const axis =
        Math.abs(normal.x) === 1 ? 'x' : Math.abs(normal.z) === 1 ? 'z' : 'y';
      return { ...block.state, axis };
    }

    return block.state;
  }

  overlapsPlayer(position) {
    const dx = Math.abs(position.x - this.player.position.x);
    const dz = Math.abs(position.z - this.player.position.z);
    const withinXZ =
      dx < this.player.radius + 0.5 && dz < this.player.radius + 0.5;

    const withinY =
      position.y + 0.5 > this.player.position.y - this.player.height &&
      position.y - 0.5 < this.player.position.y;

    return withinXZ && withinY;
  }
}
