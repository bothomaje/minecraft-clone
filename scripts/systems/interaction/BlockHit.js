export class BlockHit {
  constructor(worldPosition, blockPosition, normal, distance) {
    this.worldPosition = worldPosition;
    this.blockPosition = blockPosition;
    this.normal = normal;
    this.distance = distance;
  }

  get placementPosition() {
    return this.blockPosition.clone().add(this.normal);
  }
}
