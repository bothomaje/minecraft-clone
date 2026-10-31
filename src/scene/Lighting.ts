import * as THREE from 'three';
import { CONFIG } from '../core/Config';
import { Player } from '../engine/entities/Player';

export class Lighting {
  sun = new THREE.DirectionalLight();
  ambient = new THREE.AmbientLight();

  constructor(scene: THREE.Scene) {
    this.sun.intensity = CONFIG.lighting.sun.intensity;
    this.sun.position.copy(CONFIG.lighting.sun.position);
    this.sun.castShadow = CONFIG.lighting.sun.castShadow;
    this.sun.shadow.camera.left = CONFIG.lighting.sun.shadow.left;
    this.sun.shadow.camera.right = CONFIG.lighting.sun.shadow.right;
    this.sun.shadow.camera.bottom = CONFIG.lighting.sun.shadow.bottom;
    this.sun.shadow.camera.top = CONFIG.lighting.sun.shadow.top;
    this.sun.shadow.camera.near = CONFIG.lighting.sun.shadow.near;
    this.sun.shadow.camera.far = CONFIG.lighting.sun.shadow.far;
    this.sun.shadow.bias = CONFIG.lighting.sun.shadow.bias;
    this.sun.shadow.normalBias = CONFIG.lighting.sun.shadow.normalBias;
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
  update(player: Player) {
    this.sun.position.copy(player.position).add(CONFIG.lighting.sun.position);
    this.sun.target.position.copy(player.position);
  }
}
