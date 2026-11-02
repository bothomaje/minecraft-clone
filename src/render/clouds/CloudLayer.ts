import * as THREE from 'three';
import { CONFIG } from '../../core/Config';
import { meshClouds } from './CloudMesher';

type Img = CanvasImageSource & { width: number; height: number };

/** Pixel alpha > 127 = cloud */
function readMask(image: Img) {
  const w = image.width;
  const h = image.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4 + 3] > 127 ? 1 : 0;
  return { mask, w, h };
}

export class CloudLayer {
  private root = new THREE.Group();
  private geometry = new THREE.BufferGeometry();
  private materials: THREE.Material[];
  private tile: number; // world size of one repeat of the image
  private scroll = 0;

  constructor(image: Img) {
    const { cellSize, thickness, opacity } = CONFIG.clouds;
    const { mask, w, h } = readMask(image);
    this.tile = w * cellSize;

    const data = meshClouds(mask, w, h, cellSize, thickness);
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(data.positions, 3),
    );
    this.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(data.colors, 3),
    );
    this.geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    this.geometry.computeBoundingSphere();

    // Both passes use vertexColors so the vertex shader is identical and depth matches exactly
    const depthPass = new THREE.MeshBasicMaterial({
      vertexColors: true,
      colorWrite: false,
      side: THREE.DoubleSide,
    });
    const colourPass = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.materials = [depthPass, colourPass];

    // 3x3 copies of one geometry. Depth pass renders with the opaque queue, colour pass after.
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const material of this.materials) {
          const mesh = new THREE.Mesh(this.geometry, material);
          mesh.position.set(i * this.tile, 0, j * this.tile);
          this.root.add(mesh);
        }
      }
    }
  }

  mount(scene: THREE.Scene) {
    scene.add(this.root);
  }

  unmount() {
    this.root.removeFromParent();
    this.geometry.dispose();
    for (const m of this.materials) m.dispose();
  }

  update(dt: number, playerX: number, playerZ: number) {
    this.scroll = (this.scroll + CONFIG.clouds.speed * dt) % this.tile;
    // Put the centre tile under the player. The image pattern is periodic,
    // so the jump when the player crosses a tile edge is invisible.
    const x =
      Math.floor((playerX + this.scroll) / this.tile) * this.tile - this.scroll;
    const z = Math.floor(playerZ / this.tile) * this.tile;
    this.root.position.set(x, CONFIG.clouds.height, z);
  }
}
