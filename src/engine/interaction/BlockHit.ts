import * as THREE from 'three';

export class BlockHit {
  worldPosition: THREE.Vector3;
  blockPosition: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;

  constructor(
    worldPosition: THREE.Vector3,
    blockPosition: THREE.Vector3,
    normal: THREE.Vector3,
    distance: number,
  ) {
    this.worldPosition = worldPosition;
    this.blockPosition = blockPosition;
    this.normal = normal;
    this.distance = distance;
  }

  get placementPosition() {
    return this.blockPosition.clone().add(this.normal);
  }
}
