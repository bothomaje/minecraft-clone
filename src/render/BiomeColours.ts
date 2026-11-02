import * as THREE from 'three';
import { BiomeSource } from '../engine/world/BiomeSource';
import { Colourmap } from './Colourmap';
import { Tint } from './models/Shapes';

type Img = CanvasImageSource & { width: number; height: number };

export interface BiomeColourTable {
  rgb: Float32Array;
  count: number;
}

const KINDS: Tint[] = ['grass', 'foliage', 'dryFoliage'];

export function buildBiomeColours(
  source: BiomeSource,
  images: Record<Tint, Img>,
): BiomeColourTable {
  const maps = {
    grass: new Colourmap(images.grass),
    foliage: new Colourmap(images.foliage),
    dryFoliage: new Colourmap(images.dryFoliage),
  };
  const n = source.names.length;
  const rgb = new Float32Array(KINDS.length * n * 3);
  const c = new THREE.Color();

  KINDS.forEach((kind, k) => {
    source.names.forEach((name, i) => {
      const { colour } = source.biomes[name];
      const hex =
        colour[kind] ?? maps[kind].sample(colour.temperature, colour.downfall);
      c.set(hex); // hex is read as sRGB and converted to linear
      rgb.set([c.r, c.g, c.b], (k * n + i) * 3);
    });
  });

  return { rgb, count: n };
}
