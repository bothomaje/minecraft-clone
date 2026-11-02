export interface CloudMeshData {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

const SHADE = { top: 1, bottom: 0.7, sideX: 0.8, sideZ: 0.9 };

/** mask: w*h, 1 = cloud. Cell (x, z) spans x*cell..(x+1)*cell horizontally, y 0..thickness. */
export function meshClouds(
  mask: Uint8Array,
  w: number,
  h: number,
  cell: number,
  thickness: number,
): CloudMeshData {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];

  // Wraps, so the tile repeats seamlessly
  const filled = (x: number, z: number) =>
    mask[(((z % h) + h) % h) * w + (((x % w) + w) % w)] === 1;

  const quad = (shade: number, ...v: number[]) => {
    const base = pos.length / 3;
    pos.push(...v); // 4 vertices, 12 numbers
    for (let k = 0; k < 4; k++) col.push(shade, shade, shade);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const T = thickness;
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      if (!filled(x, z)) continue;
      const x0 = x * cell,
        x1 = x0 + cell;
      const z0 = z * cell,
        z1 = z0 + cell;

      quad(SHADE.top, x0, T, z1, x1, T, z1, x1, T, z0, x0, T, z0);
      quad(SHADE.bottom, x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);

      // Sides only where the neighbouring cell is empty
      if (!filled(x + 1, z))
        quad(SHADE.sideX, x1, 0, z1, x1, 0, z0, x1, T, z0, x1, T, z1);
      if (!filled(x - 1, z))
        quad(SHADE.sideX, x0, 0, z0, x0, 0, z1, x0, T, z1, x0, T, z0);
      if (!filled(x, z + 1))
        quad(SHADE.sideZ, x0, 0, z1, x1, 0, z1, x1, T, z1, x0, T, z1);
      if (!filled(x, z - 1))
        quad(SHADE.sideZ, x1, 0, z0, x0, 0, z0, x0, T, z0, x1, T, z0);
    }
  }

  return {
    positions: Float32Array.from(pos),
    colors: Float32Array.from(col),
    indices: Uint32Array.from(idx),
  };
}
