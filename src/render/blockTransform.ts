import * as THREE from 'three';
import { unpackState } from '../engine/blocks/blockState';
import { Block } from '../engine/blocks/blockParams';

const _position = new THREE.Vector3();
const _scale = new THREE.Vector3(1, 1, 1);
const _upright = new THREE.Quaternion();

const AXIS_ROTATION = {
  y: _upright,
  x: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    Math.PI / 2,
  ),
  z: new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    Math.PI / 2,
  ),
};

/**
 * Sets `matrix` to the instance transform for a block at (x, y, z),
 * rotated according to its packed block state. Overwrites any previous rotation.
 * @param {THREE.Matrix4} matrix
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {object} block Block definition
 * @param {number} state Packed block state
 * @returns {THREE.Matrix4}
 */
export function setBlockMatrix(
  matrix: THREE.Matrix4,
  x: number,
  y: number,
  z: number,
  block: Block,
  state: number,
) {
  if (state === 0 || !block.stateSchema?.axis) {
    return matrix.makeTranslation(x, y, z);
  }

  const { axis } = unpackState(block.stateSchema, state);
  return matrix.compose(
    _position.set(x, y, z),
    AXIS_ROTATION[axis as keyof typeof AXIS_ROTATION] ?? _upright,
    _scale,
  );
}
