import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three';
// import { SceneManager } from '../scene/SceneManager';
import { createOrbitCamera } from '../scene/camera';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { CONFIG } from '../core/Config';
import { World } from '../engine/world/World';
import { Player } from '../engine/entities/Player';
import { ModelLoader } from '../loaders/ModelLoader';
import { Lighting } from '../scene/Lighting';
import { Hud } from '../ui/Hud';
import { PhysicsSystem } from '../systems/PhysicsSystem';
// import { ResizeSystem } from '../systems/ResizeSystem';
import { InputSystem } from '../systems/InputSystem';
import { InteractionSystem } from '../engine/interaction/InteractionSystem';
import { PersistenceSystem } from '../systems/PersistenceSystem';
// import { createDebugGui } from '../ui/DebugGui';
import { SoundManager } from '../loaders/SoundManager';
import { InventoryUi } from '../ui/InventoryUi';
import { surfaceHeightAt } from '../engine/world/WorldGenerator';
import { WorldRenderer } from '../render/WorldRenderer';
// import { Scene, WebGLRenderer } from 'three';
import { TextureAtlas } from '../render/atlas/TextureAtlas';
import { bakeMeshTables } from '../render/MeshTables';
import { createMaterials } from '../render/Materials';
import { getTextures } from '../render/models/BlockRender';
import { cloudTexture, colourmaps } from '../loaders/TextureManager';
import { CloudLayer } from '../render/clouds/CloudLayer';
import { buildBiomeColours } from '../render/BiomeColours';
import { biomeSources } from '../engine/world/BiomeSource';
import { FixedStep } from './GameLoop';

export class Game {
  readonly stats = new Stats();
  readonly orbitCamera = createOrbitCamera();
  readonly world = new World();
  readonly player: Player;

  private controls: OrbitControls;
  private lighting: Lighting;
  private hud: Hud;
  private inventoryUi: InventoryUi;
  private physics: PhysicsSystem;
  private interaction: InteractionSystem;
  private step = new FixedStep(1 / 120);
  private worldRenderer: WorldRenderer;
  private modelLoader = new ModelLoader();
  private sounds: SoundManager;
  private clouds: CloudLayer;

  constructor(scene: THREE.Scene, domElement: HTMLElement) {
    document.body.append(this.stats.dom);

    this.controls = new OrbitControls(this.orbitCamera, domElement);
    CONFIG.player.position.y =
      surfaceHeightAt(
        this.world.params,
        CONFIG.player.position.x,
        CONFIG.player.position.z,
      ) + 3;
    this.controls.target.copy(CONFIG.player.position);
    this.controls.update();

    const atlas = TextureAtlas.build(getTextures());
    const colours = buildBiomeColours(
      biomeSources[this.world.params.biomeSource],
      {
        grass: colourmaps.grass.image,
        foliage: colourmaps.foliage.image,
        dryFoliage: colourmaps.dryFoliage.image,
      },
    );
    this.worldRenderer = new WorldRenderer(
      this.world,
      bakeMeshTables(atlas, colours),
      createMaterials(atlas),
    );
    this.worldRenderer.mount(scene);
    this.world.generate();

    this.clouds = new CloudLayer(cloudTexture.image);
    this.clouds.mount(scene);

    this.player = new Player(scene);
    this.orbitCamera.position.set(
      this.player.position.x,
      this.player.position.y + 8,
      this.player.position.z - 16,
    );
    this.orbitCamera.lookAt(this.player.position);

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
    new InputSystem(this.player);
    new PersistenceSystem(this.world, this.player);
  }

  get activeCamera(): THREE.PerspectiveCamera {
    return this.player.controls.isLocked
      ? this.player.camera
      : this.orbitCamera;
  }

  private tick = (dt: number) => {
    this.player.update();
    this.interaction.update(dt);
    this.physics.update(dt, this.player, this.world);
  };

  update = (dt: number) => {
    this.hud.update();
    this.inventoryUi.update();

    if (this.player.controls.isLocked) {
      this.step.run(dt, this.tick);
      this.world.update(this.player);
      this.lighting.update(this.player);
    }

    this.worldRenderer.update();
    this.clouds.update(dt, this.player.position.x, this.player.position.z);
    this.stats.update();
  };

  resize(width: number, height: number) {
    for (const camera of [this.orbitCamera, this.player.camera]) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  dispose() {
    this.worldRenderer.unmount();
    this.clouds.unmount();
    this.controls.dispose();
    this.stats.dom.remove();
  }
}
