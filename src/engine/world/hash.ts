export function hashRandom(
  seed: number,
  x: number,
  z: number,
  salt = 0,
): number {
  let h = Math.imul(seed | 0, 0x9e3779b1);
  h = Math.imul(h ^ x, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h ^ z, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h ^ salt, 0x27d4eb2f);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
