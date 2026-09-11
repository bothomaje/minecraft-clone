import * as THREE from 'three';
import { CONFIG } from '../../app/config';

export class Tool extends THREE.Group {
  animate = false;
  animationAmplitude = CONFIG.tool.animation.amplitude;
  animationDuration = CONFIG.tool.animation.duration;
  animationStart = 0;
  animationSpeed = CONFIG.tool.animation.speed;
  animation = undefined;
  toolMesh = undefined;

  get animationTime() {
    return performance.now() - this.animationStart;
  }

  /**
   * Trigger a new animation of the tool
   */
  startAnimation() {
    if (this.animate) return;

    this.animate = true;
    this.animationStart = performance.now();

    clearTimeout(this.animation);

    this.animation = setTimeout(() => {
      this.animate = false;
      this.toolMesh.rotation.z = 0;
    }, this.animationDuration);
  }

  /**
   * Updates the tool animation state
   */
  update() {
    if (this.animate && this.toolMesh) {
      this.toolMesh.rotation.z =
        this.animationAmplitude *
        Math.sin(this.animationTime * this.animationSpeed);
    }
  }

  /**
   * Sets the active tool mesh
   * @param {THREE.Mesh} mesh
   */
  setMesh(mesh) {
    this.clear();

    this.toolMesh = mesh;
    this.add(this.toolMesh);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    this.position.copy(CONFIG.tool.position);
    this.scale.setScalar(CONFIG.tool.scale);
    this.rotation.z = CONFIG.tool.rotation.z;
    this.rotation.y = CONFIG.tool.rotation.y;
  }
}
