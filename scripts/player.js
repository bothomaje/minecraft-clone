import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { blocks } from './blocks';

const CENTRE_SCREEN = new THREE.Vector2();

export class Player {
    radius = 0.5;
    height = 1.75;
    jumpSpeed = 10;
    onGround = false;

    maxSpeed = 10;
    input = new THREE.Vector3();
    velocity = new THREE.Vector3();
    #worldVelocity = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    controls = new PointerLockControls(this.camera, document.body);
    cameraHelper = new THREE.CameraHelper(this.camera);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
    selectedCoords = null;
    activeBlockId = blocks.grass.id;

    /**
     * @param {THREE.Scene} scene
     */
    constructor(scene) {
        this.camera.position.set(32, 16, 32);
        scene.add(this.camera);
        scene.add(this.cameraHelper);

        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));

        // Wireframe mesh visualizing the player's bounding cylinder
        this.boundsHelper = new THREE.Mesh(
            new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
            new THREE.MeshBasicMaterial({ wireframe: true })
        );
        // scene.add(this.boundsHelper);

        const selectionMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.3,
            color: 0xffffaa
        });
        const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
        scene.add(this.selectionHelper);
    }

    /**
     * Returns the velocity of the player in the world coordinates
     * @returns {THREE.Vector3}
     */
    get worldVelocity() {
        this.#worldVelocity.copy(this.velocity);
        this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
        return this.#worldVelocity;
    }

    /**
     * Update the player state
     * @param {World} world
     */
    update(world) {
        this.updateRaycaster(world);
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
            this.selectedCoords = chunk.position.clone()
            this.selectedCoords.applyMatrix4(blockMatrix);

            if (this.activeBlockId !== blocks.empty.id) {
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

            document.getElementById('player-position').innerHTML = this.toString();
        }
    }

    /**
     * Updates the position of the player's bounding cylinder helper
     */
    updateBoundsHelper() {
        this.boundsHelper.position.copy(this.position);
        this.boundsHelper.position.y -= this.height / 2;
    }

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
            console.log('controls locked');
        }

        switch(event.code) {
            case 'Digit0':
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
                this.activeBlockId = Number(event.key);
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
        switch(event.code) {
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
                this.position.set(32, 16, 32);
                this.velocity.set(0, 0, 0);
                break;
        }
    }

    /**
     * Returns player position in a readable string format
     * @returns {string}
     */
    toString() {
        let str = '';
        str += `X: ${this.position.x.toFixed(3)} `;
        str += `Y: ${this.position.y.toFixed(3)} `;
        str += `Z: ${this.position.z.toFixed(3)}`;
        return str;
    }
}
