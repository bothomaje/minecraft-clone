export type Vec3 = readonly [number, number, number];

// Face order: +x -x +y -y +z -z
export const FACE_NORMALS: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
export const NO_CULL = 255;

export function faceIndexOf(n: Vec3): number {
  return FACE_NORMALS.findIndex(
    (f) => f[0] === n[0] && f[1] === n[1] && f[2] === n[2],
  );
}
