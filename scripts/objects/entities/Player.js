import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Tool } from './Tool';
import { CONFIG } from '../../app/config';
import { state } from '../../app/state';
import { createPlayerCamera } from '../../scene/camera';
import { textures } from '../../loaders/TextureManager';
import { Inventory } from '../items/Inventory';

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

  tool = new Tool();
  inventory = new Inventory();
  listener = new THREE.AudioListener();

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.camera.position.copy(CONFIG.player.position);
    scene.add(this.camera);

    this.camera.add(this.tool);
    this.camera.add(this.listener);

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

    const crackMaterial = new THREE.MeshBasicMaterial(
      CONFIG.player.crackHelper.material,
    );
    const crackGeometry = new THREE.BoxGeometry(
      CONFIG.player.crackHelper.geometry,
      CONFIG.player.crackHelper.geometry,
      CONFIG.player.crackHelper.geometry,
    );
    this.crackHelper = new THREE.Mesh(crackGeometry, crackMaterial);
    this.crackHelper.visible = false;
    scene.add(this.crackHelper);
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
  update() {
    this.tool.update();
  }

  showSelection(position, colour, scale = 1) {
    this.selectionHelper.position.copy(position);
    this.selectionHelper.scale.setScalar(scale);
    if (colour !== undefined)
      this.selectionHelper.material.color.setHex(colour);
    this.selectionHelper.visible = true;
  }

  hideSelection() {
    this.selectionHelper.visible = false;
  }

  showCrack(position, stage) {
    const clampedStage = Math.max(
      0,
      Math.min(stage, textures.breaking.length - 1),
    );
    this.crackHelper.position.copy(position);
    if (this.crackHelper.material.map !== textures.breaking[clampedStage]) {
      this.crackHelper.material.map = textures.breaking[clampedStage];
      this.crackHelper.material.needsUpdate = true;
    }
    this.crackHelper.visible = true;
  }

  hideCrack() {
    this.crackHelper.visible = false;
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
    }
  }

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
