import * as THREE from 'three';
import { CONFIG } from '../app/config';

export class SceneManager {
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer();

  constructor() {
    // Scene setup
    this.scene.fog = new THREE.Fog(
      CONFIG.scene.fog.colour,
      CONFIG.scene.fog.near,
      CONFIG.scene.fog.far,
    );

    // Renderer setup
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(CONFIG.renderer.clearColour);
    this.renderer.shadowMap.enabled = CONFIG.renderer.shadowMap.enabled;
    this.renderer.shadowMap.type = CONFIG.renderer.shadowMap.type;
    document.body.appendChild(this.renderer.domElement);
  }
}
