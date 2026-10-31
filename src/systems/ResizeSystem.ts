import { PerspectiveCamera, WebGLRenderer } from 'three';

export class ResizeSystem {
  renderer: WebGLRenderer;
  cameras: PerspectiveCamera[];

  /**
   * Initialises the ResizeSystem
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.PerspectiveCamera[]} cameras
   */
  constructor(renderer: WebGLRenderer, cameras: PerspectiveCamera[]) {
    this.renderer = renderer;
    this.cameras = cameras;
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.cameras.forEach((camera) => {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
