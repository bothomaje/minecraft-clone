import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from '../../utils/Rng';
import { blocks, blocksById, resources } from '../blocks/blocksRegistry';
import { CONFIG } from '../../app/config';
import { getBiome } from './Biome';

const geometry = new THREE.BoxGeometry();

export class Chunk extends THREE.Group {
  // Extra instance capacity reserved on top of what's needed at generation time,
  // so placing a handful of new blocks doesn't immediately force a mesh resize
  PLACEMENT_HEADROOM = CONFIG.world.headroom;
  data = new Map();

  static dataKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  /**
   * @param {{ width: number, minHeight: number, maxHeight: number }} size
   * @param {World} world
   * @param {DataStore} dataStore
   */
  constructor(size, world, dataStore) {
    super();
    this.loaded = false;
    this.size = size;
    this.world = world;
    this.dataStore = dataStore;
  }

  /**
   * Generates the world data and meshes
   */
  generate() {
    const rng = new RNG(this.world.params.seed);
    this.initializeTerrain();
    this.generateTerrain(rng);
    this.generateClouds(rng);
    this.loadPlayerChanges();
    this.generateMeshes();
    this.loaded = true;
  }

  /**
   * Initializes the world terrain data
   */
  initializeTerrain() {
    this.data.clear();

    for (let x = 0; x < this.size.width; x++) {
      for (let y = this.size.minY; y < this.size.maxY; y++) {
        for (let z = 0; z < this.size.width; z++) {
          this.data.set(Chunk.dataKey(x, y, z), {
            id: blocks.empty.id,
            instanceId: null,
            state: null,
          });
        }
      }
    }
  }

  /**
   * Generates the terrain data for the world
   * @param {RNG} rng
   */
  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const biome = getBiome(
          simplex,
          this.position.x,
          this.position.z,
          x,
          z,
          this.world.params,
        );

        // Compute the noise value at this x-z location
        const value = simplex.noise(
          (this.position.x + x) / this.world.params.terrain.scale,
          (this.position.z + z) / this.world.params.terrain.scale,
        );

        // Scale the noise based on the magnitude/offset
        const scaledNoise =
          this.world.params.terrain.offset +
          this.world.params.terrain.magnitude * value;

        // Computing the height of the terrain at this x-z location
        let height = Math.floor(scaledNoise);

        // Clamping height between 0 and max height
        height = Math.max(this.size.minY, Math.min(height, this.size.maxY - 1));

        // Fill in all blocks at or below the terrain height
        for (let y = this.size.maxY; y >= this.size.minY; y--) {
          if (y <= this.world.params.terrain.waterLevel && y === height) {
            this.setBlockId(x, y, z, blocks.sand);
          } else if (y === height) {
            let blockType;
            if (biome === 'Desert') {
              blockType = blocks.sand;
            } else if (biome === 'Temperate' || biome === 'Jungle') {
              blockType = blocks.grassBlock;
            } else if (biome === 'Tundra') {
              blockType = blocks.snow;
            }
            this.setBlockId(x, y, z, blockType);

            if (rng.random() < this.world.params.trees.frequency) {
              this.generateTree(rng, biome, x, height + 1, z);
            }
          } else if (
            y < height &&
            this.getBlock(x, y, z).id === blocks.empty.id
          ) {
            this.generateResource(simplex, x, y, z);
          }
        }
      }
    }
  }

  /**
   * Determines if a resource block should be generated at (x, y, z)
   * @param {SimplexNoise} simplex
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  generateResource(simplex, x, y, z) {
    this.setBlockId(x, y, z, blocks.dirt);

    resources.forEach((resource) => {
      const value = simplex.noise3d(
        (this.position.x + x) / resource.scale.x,
        (this.position.y + y) / resource.scale.y,
        (this.position.z + z) / resource.scale.z,
      );

      if (value > resource.scarcity) {
        this.setBlockId(x, y, z, resource);
      }
    });
  }

  /**
   * Populate the world with trees
   * @param {RNG} rng
   * @param {string} biome
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  generateTree(rng, biome, x, y, z) {
    const minHeight = this.world.params.trees.trunk.minHeight;
    const maxHeight = this.world.params.trees.trunk.maxHeight;
    const height = Math.round(
      minHeight + (maxHeight - minHeight) * rng.random(),
    );

    // Tree trunk starts here
    for (let treeY = y; treeY <= y + height; treeY++) {
      if (biome === 'Temperate' || biome === 'Tundra') {
        this.setBlockId(x, treeY, z, blocks.oakLog);
      } else if (biome === 'Jungle') {
        this.setBlockId(x, treeY, z, blocks.jungleLog);
      } else if (biome === 'Desert') {
        this.setBlockId(x, treeY, z, blocks.cactus);
      }
    }
    if (biome === 'Temperate' || biome === 'Jungle') {
      this.generateTreeCanopy(biome, x, y + height, z, rng);
    }
  }

  /**
   * Generate the canopy for a tree
   * @param {string} biome
   * @param {number} centreX
   * @param {number} centreY
   * @param {number} centreZ
   * @param {RNG} rng
   */
  generateTreeCanopy = (biome, centreX, centreY, centreZ, rng) => {
    const minRadius = this.world.params.trees.canopy.minRadius;
    const maxRadius = this.world.params.trees.canopy.maxRadius;
    const radius = Math.round(
      minRadius + (maxRadius - minRadius) * rng.random(),
    );

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const n = rng.random();

          if (x * x + y * y + z * z >= radius * radius) continue;

          if (n < this.world.params.trees.canopy.density) {
            if (biome === 'Temperate') {
              this.setBlockId(
                centreX + x,
                centreY + y,
                centreZ + z,
                blocks.oakLeaves,
              );
            } else if (biome === 'Jungle') {
              this.setBlockId(
                centreX + x,
                centreY + y,
                centreZ + z,
                blocks.jungleLeaves,
              );
            }
          }
        }
      }
    }
  };

  /**
   * Creates happy little clouds
   * @param {RNG} rng
   */
  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value =
          (simplex.noise(
            (this.position.x + x) / this.world.params.clouds.scale,
            (this.position.z + z) / this.world.params.clouds.scale,
          ) +
            1) *
          0.5;

        if (value < this.world.params.clouds.density) {
          this.setBlockId(x, this.size.maxY - 1, z, blocks.cloud);
        }
      }
    }
  }

  /**
   * Pulls any changes from the data store and applies them to the data model
   */
  loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = this.size.minY; y < this.size.maxY; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (
            this.dataStore.contains(this.position.x, this.position.z, x, y, z)
          ) {
            const block = this.dataStore.get(
              this.position.x,
              this.position.z,
              x,
              y,
              z,
            );
            this.setBlockId(x, y, z, blocksById.get(block.id));
          }
        }
      }
    }
  }

  /**
   * Generate the water plane at sea level
   */
  generateWater() {
    const material = new THREE.MeshLambertMaterial(CONFIG.world.water.material);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
    mesh.rotateX(-Math.PI / 2.0);
    mesh.position.set(
      this.size.width / 2,
      this.world.params.terrain.waterLevel,
      this.size.width / 2,
    );
    mesh.scale.set(this.size.width, this.size.width, 1);
    mesh.layers.set(1);

    this.add(mesh);
  }

  /**
   * Generates the 3D representation of the world from the world data
   */
  generateMeshes() {
    this.clear();
    this.generateWater();

    // const { width, height } = this.size;
    const visible = new Uint8Array(
      this.size.width * (this.size.maxY - this.size.minY) * this.size.width,
    );
    const index = (x, y, z) =>
      (x * (this.size.maxY - this.size.minY) + (y - this.size.minY)) *
        this.size.width +
      z;

    // First pass: count how many *visible* instances each block type actually
    // needs in this chunk. Most chunks won't contain most block types at all.
    const counts = {};
    for (let x = 0; x < this.size.width; x++) {
      for (let y = this.size.minY; y < this.size.maxY; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          if (blockId === blocks.empty.id) continue;
          if (this.isBlockObscured(x, y, z)) continue;

          visible[index(x, y, z)] = 1;
          counts[blockId] = (counts[blockId] || 0) + 1;
        }
      }
    }

    // Second pass: only create a mesh for block types actually present here,
    // sized to what's needed plus a little headroom for later placement.
    const meshes = {};
    for (const blockIdStr of Object.keys(counts)) {
      const blockId = Number(blockIdStr);
      const blockType = blocksById.get(blockId);
      const capacity = counts[blockId] + this.PLACEMENT_HEADROOM;

      const mesh = new THREE.InstancedMesh(
        geometry,
        blockType.material,
        capacity,
      );
      mesh.name = blockType.id;
      mesh.count = 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes[blockId] = mesh;
    }

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = this.size.minY; y < this.size.maxY; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (!visible[index(x, y, z)]) continue;

          const blockId = this.getBlock(x, y, z).id;
          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          matrix.setPosition(x, y, z);
          mesh.setMatrixAt(instanceId, matrix);
          this.setBlockInstanceId(x, y, z, instanceId);
          mesh.count++;
        }
      }
    }

    this.add(...Object.values(meshes));
  }

  /**
   * Finds the instanced mesh for `blockId` in this chunk, creating a new
   * (small-capacity) one if this block type wasn't present at generation time
   * @param {number} blockId
   * @returns {THREE.InstancedMesh}
   */
  getOrCreateMesh(blockId) {
    let mesh = this.children.find((child) => child.name === blockId);

    if (!mesh) {
      const blockType = blocksById.get(blockId);

      mesh = new THREE.InstancedMesh(
        geometry,
        blockType.material,
        this.PLACEMENT_HEADROOM,
      );

      mesh.name = blockId;
      mesh.count = 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.add(mesh);
    }

    return mesh;
  }

  /**
   * Replaces `mesh` with a copy that has more instance capacity, preserving
   * all existing instance matrices and their instance ids
   * @param {THREE.InstancedMesh} mesh
   * @returns {THREE.InstancedMesh}
   */
  growMesh(mesh) {
    const newCapacity = mesh.instanceMatrix.count + this.PLACEMENT_HEADROOM;
    const blockType = blocksById.get(Number(mesh.name));

    const newMesh = new THREE.InstancedMesh(
      geometry,
      blockType.material,
      newCapacity,
    );

    newMesh.name = mesh.name;
    newMesh.castShadow = true;
    newMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      newMesh.setMatrixAt(i, matrix);
    }
    newMesh.count = mesh.count;
    newMesh.instanceMatrix.needsUpdate = true;
    newMesh.computeBoundingSphere();

    this.remove(mesh);
    this.add(newMesh);

    return newMesh;
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number, state: {}} | null}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data.get(Chunk.dataKey(x, y, z));
    } else {
      return null;
    }
  }

  /**
   * Adds a new block at (x, y, z) of type `blockId`
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {{id: number, instanceId: number, state: {}}} block
   */
  addBlock(x, y, z, block) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, block);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, {
        id: block.id,
        state: this.getBlock(block)?.state,
      });
    }
  }

  /**
   * Removes the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block && block.id !== blocks.empty.id) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty);
      this.dataStore.set(this.position.x, this.position.z, x, y, z, {
        id: blocks.empty.id,
        state: null,
      });
    }
  }

  /**
   * Removes the mesh instance associated with `block` by swapping it
   * with the last instance and decrementing the instance count
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    if (block.instanceId === null) return;

    // Get the mesh and instance id of the block
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id,
    );

    if (!mesh) {
      throw new Error(`Could not find InstancedMesh for block ${block.id}`);
    }

    const instanceId = block.instanceId;

    // Swapping the transformation matrix of the block in the last position
    // with the block that we are going to remove
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Updating the instance id of the block in the last position to its new instance id
    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // Swapping the transformation matrices
    mesh.setMatrixAt(instanceId, lastMatrix);

    // Remove the last instance from the scene
    mesh.count--;

    // Notify the instanced mesh we updated the instance matrix
    // Also re-compute the bounding sphere so raycasting works
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // Remove the instance associated with the block
    this.setBlockInstanceId(x, y, z, null);
  }

  /**
   * Create a new instance for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);

    // Verify the block exists and is not an empty block type
    if (block && block.id !== blocks.empty.id && block.instanceId === null) {
      // Get the mesh for the block, creating it if this block type wasn't
      // present when the chunk was generated, and growing it if it's full
      let mesh = this.getOrCreateMesh(block.id);
      if (mesh.count >= mesh.instanceMatrix.count) {
        mesh = this.growMesh(mesh);
      }

      if (mesh.count >= mesh.instanceMatrix.count) {
        mesh = this.growMesh(mesh);
      }

      if (mesh.count >= mesh.instanceMatrix.count) {
        throw new Error(
          `InstancedMesh capacity exceeded: ${mesh.count}/${mesh.instanceMatrix.count}`,
        );
      }

      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);

      // Compute the transformation matrix for the new instance and update the instanced mesh
      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /**
   * Returns the id of the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number}
   */
  getBlockId(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.getBlock(x, y, z).id;
    }
    if (!this.world) return blocks.empty.id;

    const worldX = this.position.x + x;
    const worldZ = this.position.z + z;
    const block = this.world.getBlock(worldX, y, worldZ);
    return block ? block.id : blocks.empty.id;
  }

  /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {{id: number, instanceId: number, state: {...}} | null} block
   */
  setBlockId(x, y, z, block) {
    if (this.inBounds(x, y, z)) {
      const b = this.data.get(Chunk.dataKey(x, y, z));
      b.id = block.id;
      b.state = block.state;
    }
  }

  /**
   * Sets the block instance id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data.get(Chunk.dataKey(x, y, z)).instanceId = instanceId;
    }
  }

  /**
   * Checks if the (x, y, z) coordinates are within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= this.size.minY &&
      y < this.size.maxY &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns true if this block is completely hidden by other blocks
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  isBlockObscured(x, y, z) {
    const neighbourIds = [
      this.getBlockId(x, y + 1, z),
      this.getBlockId(x, y - 1, z),
      this.getBlockId(x + 1, y, z),
      this.getBlockId(x - 1, y, z),
      this.getBlockId(x, y, z + 1),
      this.getBlockId(x, y, z - 1),
    ];

    return neighbourIds.every((id) => blocksById.get(id)?.opaque);
  }

  /**
   * Clears all block instances in the chunk
   */
  disposeInstances() {
    this.traverse((obj) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }
}
