import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { blocks } from './blocks';
import { Tool } from './tool';
import { CONFIG } from './app/config';
import { state } from './app/state';

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

  camera = new THREE.PerspectiveCamera(
    CONFIG.player.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.player.camera.near,
    CONFIG.player.camera.far,
  );
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
    this.camera.layers.enable(1);
    scene.add(this.camera);

    this.camera.add(this.tool);

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));

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
   * Event handler for 'keydown' event
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    if (!this.controls.isLocked) {
      this.controls.lock();
    }

    switch (event.code) {
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
        document
          .getElementById(`toolbar-${state.activeBlockId}`)
          .classList.remove('selected');
        state.activeBlockId = CONFIG.toolbar.slots[Number(event.key)];
        document
          .getElementById(`toolbar-${state.activeBlockId}`)
          .classList.add('selected');
        this.tool.visible = state.activeBlockId === blocks.empty.id;
        break;
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
    }
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
      case 'KeyR':
        this.position.copy(CONFIG.player.position);
        this.velocity.set(0, 0, 0);
        break;
    }
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
