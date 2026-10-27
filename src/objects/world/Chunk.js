import * as THREE from 'three';
import { blocks, blocksById } from '../blocks/BlocksRegistry';
import { CONFIG } from '../../app/Config';
import {
  ChunkData,
  packEdit,
  UNLOADED,
  unpackEdit,
} from '../../engine/world/ChunkData';
import { CHUNK_VOLUME } from '../../engine/world/constants';
import {
  inLocalBounds,
  blockIndex,
  indexToLocal,
  chunkPos,
} from '../../engine/world/coords';
import { setBlockMatrix } from '../../render/blockTransform';
import { generateChunkData } from '../../engine/world/WorldGenerator';

const geometry = new THREE.BoxGeometry();
const NO_INSTANCE = -1;

export class Chunk extends THREE.Group {
  PLACEMENT_HEADROOM = CONFIG.world.headroom;
  chunkData = new ChunkData();
  instanceIds = new Int32Array(CHUNK_VOLUME).fill(NO_INSTANCE);

  get chunkX() {
    return Math.round(this.position.x / this.size.width);
  }

  get chunkZ() {
    return Math.round(this.position.z / this.size.width);
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
    this.initializeTerrain();
    this.chunkData = generateChunkData(
      this.world.params,
      chunkPos(this.chunkX, this.chunkZ),
    );
    this.loadPlayerChanges();
    this.generateMeshes();
    this.loaded = true;
  }

  /**
   * Initializes the world terrain data
   */
  initializeTerrain() {
    this.chunkData.clear();
    this.instanceIds.fill(NO_INSTANCE);
  }

  /**
   * Pulls any changes from the data store and applies them to the data model
   */
  loadPlayerChanges() {
    const edits = this.dataStore.chunkEdits(this.chunkX, this.chunkZ);
    if (!edits) return;

    for (const [index, value] of edits) {
      const { id, state } = unpackEdit(value);
      const block = blocksById.get(id);
      if (!block) continue;
      const { x, y, z } = indexToLocal(index);
      this.setBlockId(x, y, z, block, state);
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

    const visible = new Uint8Array(CHUNK_VOLUME);
    const index = blockIndex;

    // First pass: count how many *visible* instances each block type actually
    // needs in this chunk. Most chunks won't contain most block types at all.
    const counts = {};
    for (let x = 0; x < this.size.width; x++) {
      for (let y = this.size.minY; y < this.size.maxY; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlockId(x, y, z);
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

          const blockId = this.getBlockId(x, y, z);
          const mesh = meshes[blockId];
          const instanceId = mesh.count;
          setBlockMatrix(
            matrix,
            x,
            y,
            z,
            blocksById.get(blockId),
            this.chunkData.getState(x, y, z),
          );
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
   * Adds a new block at (x, y, z) of type `blockId`
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {{id: number, instanceId: number, state: {}}} block
   */
  addBlock(x, y, z, block, state = 0) {
    if (
      this.inBounds(x, y, z) &&
      this.getBlockId(x, y, z) === blocks.empty.id
    ) {
      this.setBlockId(x, y, z, block, state);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(
        this.chunkX,
        this.chunkZ,
        blockIndex(x, y, z),
        packEdit(block.id, state),
      );
    }
  }

  /**
   * Removes the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    if (
      this.inBounds(x, y, z) &&
      this.getBlockId(x, y, z) !== blocks.empty.id
    ) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty);
      this.dataStore.set(
        this.chunkX,
        this.chunkZ,
        blockIndex(x, y, z),
        packEdit(blocks.empty.id, 0),
      );
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
    const instanceId = this.getInstanceId(x, y, z);
    if (instanceId === NO_INSTANCE) return;
    const blockId = this.getBlockId(x, y, z);

    // Get the mesh and instance id of the block
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === blockId,
    );

    if (!mesh) {
      throw new Error(`Could not find InstancedMesh for block ${blockId}`);
    }

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
    mesh.instanceMatrix.needsUpdate = true;

    // Remove the instance associated with the block
    this.setBlockInstanceId(x, y, z, NO_INSTANCE);
  }

  /**
   * Create a new instance for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlockInstance(x, y, z) {
    if (!this.inBounds(x, y, z)) return;
    const blockId = this.getBlockId(x, y, z);

    // Verify the block exists and is not an empty block type
    if (
      blockId !== blocks.empty.id &&
      this.getInstanceId(x, y, z) === NO_INSTANCE
    ) {
      // Get the mesh for the block, creating it if this block type wasn't
      // present when the chunk was generated, and growing it if it's full
      let mesh = this.getOrCreateMesh(blockId);
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
      const matrix = setBlockMatrix(
        new THREE.Matrix4(),
        x,
        y,
        z,
        blocksById.get(blockId),
        this.chunkData.getState(x, y, z),
      );
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
      return this.chunkData.getId(x, y, z);
    }
    if (!this.world) return blocks.empty.id;

    const id = this.world.getBlockId(
      this.position.x + x,
      y,
      this.position.z + z,
    );
    return id === UNLOADED ? blocks.empty.id : id;
  }

  /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {{id: number, instanceId: number, state: {...}} | null} block
   */
  setBlockId(x, y, z, block, state = 0) {
    if (this.inBounds(x, y, z)) {
      this.chunkData.set(x, y, z, block.id, state);
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
      this.instanceIds[blockIndex(x, y, z)] = instanceId;
    }
  }

  getInstanceId(x, y, z) {
    return this.inBounds(x, y, z)
      ? this.instanceIds[blockIndex(x, y, z)]
      : NO_INSTANCE;
  }

  /**
   * Checks if the (x, y, z) coordinates are within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    return inLocalBounds(x, y, z);
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
