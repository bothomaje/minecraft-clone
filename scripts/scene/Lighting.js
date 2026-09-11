import * as THREE from 'three';
import { CONFIG } from '../app/config';

export class Lighting {
  sun = new THREE.DirectionalLight();
  ambient = new THREE.AmbientLight();

  constructor(scene) {
    this.sun.intensity = CONFIG.lighting.sun.intensity;
    this.sun.position.copy(CONFIG.lighting.sun.position);
    this.sun.castShadow = CONFIG.lighting.sun.castShadow;
    this.sun.shadow.camera.left = CONFIG.lighting.sun.left;
    this.sun.shadow.camera.right = CONFIG.lighting.sun.right;
    this.sun.shadow.camera.bottom = CONFIG.lighting.sun.bottom;
    this.sun.shadow.camera.top = CONFIG.lighting.sun.top;
    this.sun.shadow.camera.near = CONFIG.lighting.sun.near;
    this.sun.shadow.camera.far = CONFIG.lighting.sun.far;
    this.sun.shadow.bias = CONFIG.lighting.sun.bias;
    this.sun.shadow.normalBias = CONFIG.lighting.sun.normalBias;
    this.sun.shadow.mapSize = new THREE.Vector2(
      CONFIG.lighting.sun.shadow.mapSize,
      CONFIG.lighting.sun.shadow.mapSize,
    );

    this.ambient.intensity = CONFIG.lighting.ambient.intensity;

    scene.add(this.ambient);
    scene.add(this.sun);
    scene.add(this.sun.target);
  }

  /**
   * Keeps the sun at a fixed offset above and behind the player
   * @param {Player} player
   */
  update(player) {
    this.sun.position.copy(player.position).add(CONFIG.lighting.sun.position);
    this.sun.target.position.copy(player.position);
  }
}
