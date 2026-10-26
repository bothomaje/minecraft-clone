import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { resources } from '../objects/blocks/blocksRegistry';
import { CONFIG } from '../app/config';

export function createDebugGui(scene, world, player) {
  const gui = new GUI();

  const actions = {
    fullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
  };

  gui.add(actions, 'fullscreen').name('Toggle Full Screen');

  const sceneFolder = gui.addFolder('Scene').close();
  sceneFolder.add(scene.fog, 'near', 1, 200, 1).name('Fog Near');
  sceneFolder.add(scene.fog, 'far', 1, 200, 1).name('Fog Far');

  const playerFolder = gui.addFolder('Player').close();
  playerFolder.add(player, 'maxSpeed', 1, 20).name('Max Speed');

  const terrainFolder = gui.addFolder('Terrain').close();
  terrainFolder.add(world, 'asyncLoading').name('Async Chunk Loading');
  terrainFolder.add(world, 'drawDistance', 0, 5, 1).name('Draw Distance');
  terrainFolder.add(world.params, 'seed', 1, 10000).name('Seed');
  terrainFolder
    .add(world.params.terrain, 'waterLevel', 0, 60, 1)
    .name('Water Level');
  terrainFolder
    .add(world.params.terrain, 'soilDepth', 1, 8, 1)
    .name('Soil Depth');
  terrainFolder
    .add(world.params.terrain, 'baseHeight', 0, 60, 1)
    .name('Base Height');
  const continentFolder = terrainFolder.addFolder('Continents').close();
  continentFolder
    .add(world.params.terrain.continent, 'scale', 50, 1500)
    .name('Scale');
  continentFolder
    .add(world.params.terrain.continent, 'amplitude', 0, 40, 1)
    .name('Amplitude');
  const hillsFolder = terrainFolder.addFolder('Hills').close();
  hillsFolder.add(world.params.terrain.hills, 'scale', 10, 300).name('Scale');
  hillsFolder
    .add(world.params.terrain.hills, 'amplitude', 0, 30, 1)
    .name('Amplitude');
  hillsFolder
    .add(world.params.terrain.hills, 'octaves', 1, 6, 1)
    .name('Octaves');
  hillsFolder
    .add(world.params.terrain.hills, 'persistence', 0.1, 0.9)
    .name('Persistence');
  const mountainsFolder = terrainFolder.addFolder('Mountains').close();
  mountainsFolder
    .add(world.params.terrain.mountains, 'scale', 50, 600)
    .name('Scale');
  mountainsFolder
    .add(world.params.terrain.mountains, 'amplitude', 0, 80, 1)
    .name('Amplitude');
  mountainsFolder
    .add(world.params.terrain.mountains, 'threshold', 0, 0.9)
    .name('Threshold');
  mountainsFolder
    .add(world.params.terrain.mountains, 'power', 0.5, 4)
    .name('Power');

  const biomesFolder = terrainFolder.addFolder('Biomes').close();
  biomesFolder
    .add(world.params.biomes.temperature, 'scale', 50, 1500)
    .name('Temperature Scale');
  biomesFolder
    .add(world.params.biomes.humidity, 'scale', 50, 1500)
    .name('Humidity Scale');
  biomesFolder
    .add(world.params.biomes, 'snowLine', 20, 87, 1)
    .name('Snow Line');

  const resourcesFolder = terrainFolder.addFolder('Resources').close();
  resources.forEach((resource) => {
    const resourceFolder = resourcesFolder.addFolder(resource.name).close();
    resourceFolder.add(resource, 'scarcity', 0, 1).name('Scarcity');

    const scaleFolder = resourceFolder.addFolder('Scale');
    scaleFolder.add(resource.scale, 'x', 10, 100).name('X Scale');
    scaleFolder.add(resource.scale, 'y', 10, 100).name('Y Scale');
    scaleFolder.add(resource.scale, 'z', 10, 100).name('Z Scale');
  });

  const treesFolder = terrainFolder.addFolder('Trees').close();
  treesFolder.add(world.params.trees, 'frequency', 0, 0.1).name('Frequency');
  treesFolder
    .add(world.params.trees.trunk, 'minHeight', 0, 10, 1)
    .name('Min Trunk Height');
  treesFolder
    .add(world.params.trees.trunk, 'maxHeight', 0, 10, 1)
    .name('Max Trunk Height');
  treesFolder
    .add(world.params.trees.canopy, 'minRadius', 0, 10, 1)
    .name('Min Canopy Size');
  treesFolder
    .add(world.params.trees.canopy, 'maxRadius', 0, 10, 1)
    .name('Max Canopy Size');
  treesFolder
    .add(world.params.trees.canopy, 'density', 0, 1)
    .name('Canopy Density');

  const cloudsFolder = terrainFolder.addFolder('Clouds').close();
  cloudsFolder.add(world.params.clouds, 'scale', 0, 100).name('Cloud Size');
  cloudsFolder.add(world.params.clouds, 'density', 0, 1).name('Cloud Cover');
  cloudsFolder
    .add(world.params.clouds, 'height', 0, 87, 1)
    .name('Cloud Height');

  let regenerateTimeout = null;
  gui.onChange(() => {
    clearTimeout(regenerateTimeout);
    regenerateTimeout = setTimeout(() => {
      world.generate(true);
    }, CONFIG.world.regenerateDebounceMs);
  });
}
