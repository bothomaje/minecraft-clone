import * as THREE from 'three';
import { CONFIG } from '../../app/config';
import { BlockHit } from './BlockHit';

const CENTRE_SCREEN = new THREE.Vector2();
const _matrix = new THREE.Matrix4();

export class Raycaster {
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    CONFIG.player.raycaster.near,
    CONFIG.player.raycaster.far,
  );

  constructor() {
    this.raycaster.layers.set(0);
  }

  /**
   * Update the raycaster use for picking blocks
   * @param {World} world
   * @param {THREE.PerspectiveCamera} camera
   */
  cast(world, camera) {
    this.raycaster.setFromCamera(CENTRE_SCREEN, camera);
    const intersections = this.raycaster.intersectObject(world, true);
    if (intersections.length === 0) return null;

    const hit = intersections[0];
    const chunk = hit.object.parent; // Get chunk position of block

    // Get transformation matrix of the intersected block
    hit.object.getMatrixAt(hit.instanceId, _matrix);

    // Extract position from block's transformation matrix
    const blockPosition = chunk.position.clone().applyMatrix4(_matrix).round();

    return new BlockHit(
      hit.point.clone(),
      blockPosition,
      hit.normal.clone().round(),
      hit.distance,
    );
  }
}
