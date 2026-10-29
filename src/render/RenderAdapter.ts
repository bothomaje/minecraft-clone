import * as THREE from 'three';

export interface RenderAdapter {
  mount(scene: THREE.Scene): void;
  unmount(): void;
  update(dt: number): void;
}
