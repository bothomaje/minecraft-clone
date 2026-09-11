import * as THREE from 'three';
import { CONFIG } from '../app/config';

export function createOrbitCamera() {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.orbit.fov,
    window.innerWidth / window.innerHeight,
  );
  camera.position.copy(CONFIG.camera.orbit.position);
  camera.layers.enable(1);

  return camera;
}

export function createPlayerCamera() {
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.player.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.player.near,
    CONFIG.camera.player.far,
  );
  camera.layers.enable(1);

  return camera;
}
