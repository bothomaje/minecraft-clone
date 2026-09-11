import * as THREE from 'three';
import { CONFIG } from './app/config';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
import { createUI } from './ui';
import { Player } from './player';
import Physics from './physics';
import { blocks } from './blocks';
import { ModelLoader } from './modelLoader';
import { state } from './app/state';

// Stats display setup
const stats = new Stats();
document.body.append(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(CONFIG.renderer.clearColour);
renderer.shadowMap.enabled = CONFIG.renderer.shadowMap.enabled;
renderer.shadowMap.type = CONFIG.renderer.shadowMap.type;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(
  CONFIG.camera.orbit.fov,
  window.innerWidth / window.innerHeight,
);
orbitCamera.position.copy(CONFIG.camera.orbit.position);
orbitCamera.layers.enable(1);

// Controls setup
const controls = new OrbitControls(orbitCamera, renderer.domElement);

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(
  CONFIG.scene.fog.colour,
  CONFIG.scene.fog.near,
  CONFIG.scene.fog.far,
);

const world = new World();

world.generate();
scene.add(world);

// Player setup
const player = new Player(scene);
orbitCamera.position.set(
  player.position.x,
  player.position.y + 8,
  player.position.z - 16,
);
controls.target.copy(player.position);
controls.update();
// orbitCamera.target.copy(player.position);
// orbitCamera.update();
orbitCamera.lookAt(player.position);

const modelLoader = new ModelLoader();
modelLoader.loadModels((models) => {
  player.tool.setMesh(models.pickaxe);
});

const physics = new Physics();

// Lights setup
const sun = new THREE.DirectionalLight();

function setupLights() {
  sun.intensity = CONFIG.lighting.sun.intensity;
  sun.position.copy(CONFIG.lighting.sun.position);
  sun.castShadow = CONFIG.lighting.sun.castShadow;
  sun.shadow.camera.left = CONFIG.lighting.sun.left;
  sun.shadow.camera.right = CONFIG.lighting.sun.right;
  sun.shadow.camera.bottom = CONFIG.lighting.sun.bottom;
  sun.shadow.camera.top = CONFIG.lighting.sun.top;
  sun.shadow.camera.near = CONFIG.lighting.sun.near;
  sun.shadow.camera.far = CONFIG.lighting.sun.far;
  sun.shadow.bias = CONFIG.lighting.sun.bias;
  sun.shadow.normalBias = CONFIG.lighting.sun.normalBias;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(sun);
  scene.add(sun.target);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = CONFIG.lighting.ambient.intensity;
  scene.add(ambient);
}

function onMouseDown() {
  if (player.controls.isLocked && player.selectedCoords) {
    if (state.activeBlockId === blocks.empty.id) {
      world.removeBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z,
      );
      player.tool.startAnimation();
    } else {
      world.addBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z,
        state.activeBlockId,
      );
    }
  }
}
document.addEventListener('mousedown', onMouseDown);

// Render loop
let previousTime = performance.now();

function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;

  requestAnimationFrame(animate);

  if (player.controls.isLocked) {
    player.update(world);
    physics.update(dt, player, world);
    world.update(player);

    sun.position.copy(player.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.position);
  }

  renderer.render(
    scene,
    player.controls.isLocked ? player.camera : orbitCamera,
  );
  stats.update();

  previousTime = currentTime;
}

window.addEventListener('resize', () => {
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLights();
createUI(scene, world, player);
animate();
