import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { blocks } from '../blocks/blocksRegistry';
import { Tool } from './Tool';
import { CONFIG } from '../../app/config';
import { state } from '../../app/state';
import { createPlayerCamera } from '../../scene/camera';

const CENTRE_SCREEN = new THREE.Vector2();

export class Player {
  radius = CONFIG.player.radius;
  height = CONFIG.player.height;
  jumpSpeed = CONFIG.player.jumpSpeed;
  onGround = false;

  maxSpeed = CONFIG.player.maxSpeed;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  camera = createPlayerCamera();
  controls = new PointerLockControls(this.camera, document.body);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(),
    CONFIG.player.raycaster.near,
    CONFIG.player.raycaster.far,
  );
  selectedCoords = null;

  tool = new Tool();

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.camera.position.copy(CONFIG.player.position);
    scene.add(this.camera);

    this.camera.add(this.tool);

    const selectionMaterial = new THREE.MeshBasicMaterial(
      CONFIG.player.selectionHelper.material,
    );
    const selectionGeometry = new THREE.BoxGeometry(
      CONFIG.player.selectionHelper.geometry,
      CONFIG.player.selectionHelper.geometry,
      CONFIG.player.selectionHelper.geometry,
    );
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);

    this.raycaster.layers.set(0);
  }

  /**
   * Returns the velocity of the player in the world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0),
    );
    return this.#worldVelocity;
  }

  /**
   * Update the player state
   * @param {World} world
   */
  update(world) {
    this.updateRaycaster(world);
    this.tool.update();
  }

  /**
   * Update the raycaster use for picking blocks
   * @param {World} world
   */
  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTRE_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      // Get chunk position of block
      const chunk = intersection.object.parent;

      // Get transformation matrix of the intersected block
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      // Extract position from block's transformation matrix
      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (state.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal);
      }
      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {THREE.Vector3} dv
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  applyInputs(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      this.updatePositionDisplay();
      document.getElementById('player-position').innerHTML =
        state.playerPosition;
    }
  }

  /**
   * Updates the position of the player's bounding cylinder helper
   */
  //   updateBoundsHelper() {
  //     this.boundsHelper.position.copy(this.position);
  //     this.boundsHelper.position.y -= this.height / 2;
  //   }

  /**
   * Returns the current world position of the player
   * @type {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Returns player position in a readable string format
   */
  updatePositionDisplay() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    state.playerPosition = str;
  }
}
