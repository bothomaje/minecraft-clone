import * as THREE from 'three';
import { FACE_NORMALS, faceIndexOf, NO_CULL, Vec3 } from './Faces';

export interface Quad {
  vertices: [Vec3, Vec3, Vec3, Vec3]; // bottom-left, bottom-right, top-right, top-left
  normal: Vec3;
  texture: THREE.Texture;
  uv?: number[]; // bottom-left, bottom-right, top-right, top-left
  cull: number;
}

export type Model = Quad[];

export interface CubeTextures {
  side: THREE.Texture;
  top?: THREE.Texture;
  bottom?: THREE.Texture;
}

function faceTextures(textures: CubeTextures): THREE.Texture[] {
  const top = textures.top ?? textures.side;
  const bottom = textures.bottom ?? textures.top ?? textures.side;
  return [
    textures.side,
    textures.side,
    top,
    bottom,
    textures.side,
    textures.side,
  ];
}

export function box(min: Vec3, max: Vec3, textures: THREE.Texture[]): Model {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const faces: Vec3[][] = [
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ], // px
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ], // nx
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ], // py
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ], // ny
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ], // pz
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ], // nz
  ];

  const uv: ((vector: Vec3) => [number, number])[] = [
    ([, y, z]) => [0.5 - z, y + 0.5],
    ([, y, z]) => [z + 0.5, y + 0.5],
    ([x, , z]) => [x + 0.5, 0.5 - z],
    ([x, , z]) => [x + 0.5, z + 0.5],
    ([x, y]) => [x + 0.5, y + 0.5],
    ([x, y]) => [0.5 - x, y + 0.5],
  ];
  const onEdge = [
    x1 === 0.5,
    x0 === -0.5,
    y1 === 0.5,
    y0 === -0.5,
    z1 === 0.5,
    z0 === -0.5,
  ];

  return faces.map((vertices, face) => ({
    vertices: vertices as Quad['vertices'],
    normal: FACE_NORMALS[face],
    texture: textures[face],
    uv: vertices.flatMap(uv[face]),
    cull: onEdge[face] ? face : NO_CULL,
  }));
}

// shape registry
export const shapes = {
  cube: (textures: CubeTextures) =>
    box([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5], faceTextures(textures)),
};
export type ShapeName = keyof typeof shapes;

// rotation
export type Rotation = 'axis' | 'facing';
const rotateZ = ([x, y, z]: Vec3): Vec3 => [-y, x, z]; // y axis -> x axis
const rotateX = ([x, y, z]: Vec3): Vec3 => [x, -z, y]; // y axis -> z axis
const rotateY = ([x, y, z]: Vec3): Vec3 => [z, y, -x]; // quarter turn around Y

/** state: axis 0/1/2 = y/x/z, facing 0..3 = quarter turns. Textures turn with the shape. */
export function rotateModel(
  model: Model,
  rotation: Rotation | undefined,
  state: number,
): Model {
  if (!rotation || state === 0) return model;
  const turn =
    rotation === 'axis' ? (state === 1 ? rotateZ : rotateX) : rotateY;
  const times = rotation === 'axis' ? 1 : state;
  const spin = (v: Vec3) => {
    for (let i = 0; i < times; i++) v = turn(v);
    return v;
  };
  return model.map((quad) => {
    const normal = spin(quad.normal);
    return {
      ...quad,
      vertices: quad.vertices.map(spin) as Quad['vertices'],
      normal,
      cull: quad.cull === NO_CULL ? NO_CULL : faceIndexOf(normal),
    };
  });
}
