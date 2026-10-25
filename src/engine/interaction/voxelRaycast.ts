export interface VoxelHit {
  /** Block that was hit */
  x: number;
  y: number;
  z: number;
  /** Normal of the face that was hit. Points out of the block, towards the ray origin. */
  nx: number;
  ny: number;
  nz: number;
  /** Distance along the ray to the hit face */
  distance: number;
}

export function castVoxelRay(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDistance: number,
  isTarget: (x: number, y: number, z: number) => boolean,
): VoxelHit | null {
  const length = Math.hypot(dx, dy, dz);
  if (length === 0) return null;
  dx /= length;
  dy /= length;
  dz /= length;

  // Shift by half a block so cells line up with Math.floor
  const px = ox + 0.5;
  const py = oy + 0.5;
  const pz = oz + 0.5;

  let x = Math.floor(px);
  let y = Math.floor(py);
  let z = Math.floor(pz);

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const stepZ = Math.sign(dz);

  const deltaX = stepX === 0 ? Infinity : Math.abs(1 / dx);
  const deltaY = stepY === 0 ? Infinity : Math.abs(1 / dy);
  const deltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dz);

  // Distance along the ray to the first cell boundary on each axis
  let maxX =
    stepX === 0 ? Infinity : (stepX > 0 ? x + 1 - px : px - x) * deltaX;
  let maxY =
    stepY === 0 ? Infinity : (stepY > 0 ? y + 1 - py : py - y) * deltaY;
  let maxZ =
    stepZ === 0 ? Infinity : (stepZ > 0 ? z + 1 - pz : pz - z) * deltaZ;

  for (;;) {
    let distance: number;
    let nx = 0;
    let ny = 0;
    let nz = 0;

    if (maxX <= maxY && maxX <= maxZ) {
      distance = maxX;
      x += stepX;
      maxX += deltaX;
      nx = -stepX;
    } else if (maxY <= maxZ) {
      distance = maxY;
      y += stepY;
      maxY += deltaY;
      ny = -stepY;
    } else {
      distance = maxZ;
      z += stepZ;
      maxZ += deltaZ;
      nz = -stepZ;
    }

    if (distance > maxDistance) return null;
    if (isTarget(x, y, z)) return { x, y, z, nx, ny, nz, distance };
  }
}
