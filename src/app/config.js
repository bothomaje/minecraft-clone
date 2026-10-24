import * as THREE from 'three';

export const CONFIG = {
  renderer: {
    clearColour: 0x80a0e0,
    shadowMap: {
      enabled: true,
      type: THREE.PCFShadowMap,
    },
  },
  camera: {
    orbit: {
      fov: 75,
      position: new THREE.Vector3(-20, 20, -20),
    },
    player: {
      fov: 70,
      near: 0.1,
      far: 200,
    },
  },
  controls: {
    target: new THREE.Vector3(16, 16, 16),
  },
  scene: {
    fog: {
      colour: 0x80a0e0,
      near: 50,
      far: 100,
    },
  },
  lighting: {
    sun: {
      intensity: 3,
      position: new THREE.Vector3(50, 50, 50),
      castShadow: true,
      shadow: {
        left: -100,
        right: 100,
        bottom: -100,
        top: 100,
        near: 0.1,
        far: 200,
        bias: -0.0005,
        normalBias: 0.01,
        mapSize: 2048,
      },
    },
    ambient: {
      intensity: 0.1,
    },
  },
  player: {
    radius: 0.5,
    height: 1.75,
    jumpSpeed: 10,
    maxSpeed: 10,
    raycaster: { near: 0, far: 3 },
    position: new THREE.Vector3(32, 12, 32),
    selectionHelper: {
      geometry: 1.01,
      material: {
        transparent: true,
        opacity: 0.3,
        color: 0xffffaa,
      },
    },
    placement: 0x88ff88,
    crackHelper: {
      geometry: 1.02,
      material: {
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      },
    },
  },
  mining: {
    secondsPerHardness: 1,
    correctToolMultiplier: 4,
    wrongToolMultiplier: 1,
    soundTickInterval: 0.25,
    stages: 10,
  },
  tool: {
    animation: {
      amplitude: 0.5,
      duration: 750,
      speed: 0.025,
    },
    position: new THREE.Vector3(0.4, -0.3, -0.8),
    scale: 0.5,
    rotation: {
      z: THREE.MathUtils.degToRad(30),
      y: THREE.MathUtils.degToRad(100),
    },
  },
  inventory: {
    toolbar: 9,
    main: 27,
  },
  physics: {
    simulationRate: 200,
    gravity: 32,
    debug: {
      enabled: true,
      collision: {
        material: {
          color: 0xff0000,
          transparent: true,
          opacity: 0.2,
        },
        geometry: 1.001,
      },
      contact: {
        material: { wireframe: true, color: 0x00ff00 },
        geometry: {
          radius: 0.05,
          widthSegments: 6,
          heightSegments: 6,
        },
      },
    },
  },
  world: {
    asyncLoading: true,
    drawDistance: 2,
    headroom: 64,
    regenerateDebounceMs: 200,
    chunkSize: {
      width: 16,
      minY: -8,
      maxY: 32,
    },
    params: {
      seed: 0,
      terrain: {
        scale: 80,
        magnitude: 10,
        offset: 5,
        waterLevel: 3.4,
      },
      biomes: {
        scale: 200,
        variation: {
          amplitude: 0.2,
          scale: 50,
        },
        tundraToTemperate: 0.25,
        temperateToJungle: 0.5,
        jungleToDesert: 0.75,
      },
      trees: {
        trunk: {
          minHeight: 5,
          maxHeight: 7,
        },
        canopy: {
          minRadius: 2,
          maxRadius: 3,
          density: 0.5,
        },
        frequency: 0.02,
      },
      clouds: {
        scale: 30,
        density: 0.5,
      },
    },
    water: {
      material: {
        color: 0x9090e0,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      },
    },
    persistenceKeys: {
      params: 'minecraft_params',
      data: 'minecraft_data',
      inventory: 'minecraft_inventory',
    },
  },
};
