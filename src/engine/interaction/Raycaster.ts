import * as THREE from 'three';
import { CONFIG } from '../../app/config';
import { castVoxelRay } from './voxelRaycast';
import { blocksById } from '../../objects/blocks/blocksRegistry';
import { BlockHit } from './BlockHit';
import { BlockCategory } from '../blocks/blockParams';
import { World } from '../../objects/world/World';

export class Raycaster {
  private origin = new THREE.Vector3();
  private direction = new THREE.Vector3();

  /**
   * Finds the block the camera is looking at, using world data instead of meshes
   * @param {World} world
   * @param {THREE.PerspectiveCamera} camera
   * @returns {BlockHit | null}
   */
  cast(world: World, camera: THREE.PerspectiveCamera) {
    camera.getWorldPosition(this.origin);
    camera.getWorldDirection(this.direction);

    const hit = castVoxelRay(
      this.origin.x,
      this.origin.y,
      this.origin.z,
      this.direction.x,
      this.direction.y,
      this.direction.z,
      CONFIG.player.raycaster.far,
      (x, y, z) => {
        const block = blocksById.get(world.getBlockId(x, y, z));
        return (
          block !== undefined && block.category !== BlockCategory.NON_SOLID
        );
      },
    );
    if (!hit) return null;

    return new BlockHit(
      this.origin.clone().addScaledVector(this.direction, hit.distance),
      new THREE.Vector3(hit.x, hit.y, hit.z),
      new THREE.Vector3(hit.nx, hit.ny, hit.nz),
      hit.distance,
    );
  }
}
