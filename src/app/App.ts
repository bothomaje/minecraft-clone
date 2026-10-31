import Stats from 'three/examples/jsm/libs/stats.module.js';
import { SceneManager } from '../scene/SceneManager';
import { createOrbitCamera } from '../scene/camera';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { CONFIG } from '../core/Config';
import { World } from '../engine/world/World';
import { Player } from '../engine/entities/Player';
import { ModelLoader } from '../loaders/ModelLoader';
import { Lighting } from '../scene/Lighting';
import { Hud } from '../ui/Hud';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { ResizeSystem } from '../systems/ResizeSystem';
import { InputSystem } from '../systems/InputSystem';
import { InteractionSystem } from '../engine/interaction/InteractionSystem';
import { PersistenceSystem } from '../systems/PersistenceSystem';
// import { createDebugGui } from '../ui/DebugGui';
import { SoundManager } from '../loaders/SoundManager';
import { InventoryUi } from '../ui/InventoryUi';
import { surfaceHeightAt } from '../engine/world/WorldGenerator';
import { WorldRenderer } from '../render/WorldRenderer';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

export class App {
  stats = new Stats();
  previousTime = performance.now();
  scene: Scene;
  renderer: WebGLRenderer;
  orbitCamera: PerspectiveCamera;
  controls: OrbitControls;
  world: World;
  worldRenderer: WorldRenderer;
  player: Player;
  modelLoader: ModelLoader;
  lighting: Lighting;
  hud: Hud;
  inventoryUi: InventoryUi;
  physics: PhysicsSystem;
  sounds: SoundManager;
  interaction: InteractionSystem;

  constructor() {
    document.body.append(this.stats.dom);

    const { scene, renderer } = new SceneManager();
    this.scene = scene;
    this.renderer = renderer;

    this.orbitCamera = createOrbitCamera();

    this.controls = new OrbitControls(
      this.orbitCamera,
      this.renderer.domElement,
    );
    this.controls.target.copy(CONFIG.player.position);
    this.controls.update();

    this.world = new World();

    CONFIG.player.position.y =
      surfaceHeightAt(
        this.world.params,
        CONFIG.player.position.x,
        CONFIG.player.position.z,
      ) + 3;
    this.controls.target.copy(CONFIG.player.position);
    this.controls.update();

    this.worldRenderer = new WorldRenderer(this.world);
    this.worldRenderer.mount(scene);
    this.world.generate();
    // scene.add(this.world);

    this.player = new Player(scene);
    this.orbitCamera.position.set(
      this.player.position.x,
      this.player.position.y + 8,
      this.player.position.z - 16,
    );
    this.orbitCamera.lookAt(this.player.position);

    this.modelLoader = new ModelLoader();
    this.modelLoader.loadModels((models) => {
      if (models.pickaxe) this.player.tool.setMesh(models.pickaxe);
    });

    this.lighting = new Lighting(scene);
    this.hud = new Hud(this.player);
    this.inventoryUi = new InventoryUi(this.player);

    this.physics = new PhysicsSystem(scene);
    this.sounds = new SoundManager(this.player.listener);
    this.interaction = new InteractionSystem(
      this.player,
      this.world,
      this.sounds,
    );
    new ResizeSystem(renderer, [this.orbitCamera, this.player.camera]);
    new InputSystem(this.player);
    new PersistenceSystem(this.world, this.player);
  }

  animate = () => {
    const currentTime = performance.now();
    const dt = (currentTime - this.previousTime) / 1000;

    requestAnimationFrame(this.animate);

    this.hud.update();
    this.inventoryUi.update();

    if (this.player.controls.isLocked) {
      this.player.update();
      this.interaction.update(dt);
      this.physics.update(dt, this.player, this.world);
      this.world.update(this.player);
      this.lighting.update(this.player);
    }
    this.worldRenderer.update();

    this.renderer.render(
      this.scene,
      this.player.controls.isLocked ? this.player.camera : this.orbitCamera,
    );
    this.stats.update();

    this.previousTime = currentTime;
  };

  start() {
    // createDebugGui(this.scene, this.world, this.player);
    this.animate();
  }
}
