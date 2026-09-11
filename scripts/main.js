import { CONFIG } from './app/config';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
import { createUI } from './ui';
import { Player } from './player';
import { ModelLoader } from './modelLoader';
import { SceneManager } from './scene/SceneManager';
import { createOrbitCamera } from './scene/camera';
import { Lighting } from './scene/Lighting';
import { ResizeSystem } from './systems/ResizeSystem';
import { InteractionSystem } from './systems/InteractionSystem';
import { InputSystem } from './systems/InputSystem';
import { PersistenceSystem } from './systems/PersistenceSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';

// Stats display setup
const stats = new Stats();
document.body.append(stats.dom);

const { scene, renderer } = new SceneManager();
const orbitCamera = createOrbitCamera();

// Controls setup
const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.copy(CONFIG.player.position);
controls.update();

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
orbitCamera.lookAt(player.position);

const modelLoader = new ModelLoader();
modelLoader.loadModels((models) => {
  player.tool.setMesh(models.pickaxe);
});

const lighting = new Lighting(scene);

// Systems setup
const physics = new PhysicsSystem(scene);
new ResizeSystem(renderer, [orbitCamera, player.camera]);
new InputSystem(player);
new InteractionSystem(player, world);
new PersistenceSystem(world);

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
    lighting.update(player);
  }

  renderer.render(
    scene,
    player.controls.isLocked ? player.camera : orbitCamera,
  );
  stats.update();

  previousTime = currentTime;
}

createUI(scene, world, player);
animate();
