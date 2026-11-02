import * as THREE from 'three';
import { CONFIG } from './Config';
import { Game } from './Game';

export function start() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(CONFIG.renderer.clearColour);
  renderer.shadowMap.enabled = CONFIG.renderer.shadowMap.enabled;
  renderer.shadowMap.type = CONFIG.renderer.shadowMap.type;
  document.body.appendChild(renderer.domElement);
  // (window as any).__gl = renderer;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(
    CONFIG.scene.fog.colour,
    CONFIG.scene.fog.near,
    CONFIG.scene.fog.far,
  );

  const game = new Game(scene, renderer.domElement);
  game.resize(window.innerWidth, window.innerHeight);
  document.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    game.resize(window.innerWidth, window.innerHeight);
  });

  let previousTime = performance.now();
  const frame = (currentTime: number) => {
    requestAnimationFrame(frame);
    game.update((currentTime - previousTime) / 1000);
    previousTime = currentTime;
    renderer.render(scene, game.activeCamera);
  };
  requestAnimationFrame(frame);
}
