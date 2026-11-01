import * as THREE from 'three';
import { CHUNK_WIDTH } from '../engine/world/Constants';
import { CONFIG } from '../core/Config';
import { ChunkMeshData, MeshLayer } from './ChunkMesher';

const waterGeometry = new THREE.PlaneGeometry();
const waterMaterial = new THREE.MeshLambertMaterial(
  CONFIG.world.water.material,
);

interface Entry {
  group: THREE.Group;
  meshes: THREE.Mesh[];
}

function toGeometry(layer: MeshLayer): THREE.BufferGeometry | null {
  if (layer.indices.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(layer.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(layer.normals, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(layer.uvs, 2));
  g.setIndex(new THREE.BufferAttribute(layer.indices, 1));
  for (const grp of layer.groups)
    g.addGroup(grp.start, grp.count, grp.material);
  g.computeBoundingSphere();
  return g;
}

export class ChunkRenderer {
  readonly root = new THREE.Group();
  private entries = new Map<string, Entry>();

  constructor(
    private materials: THREE.Material[],
    private waterY: () => number,
  ) {}

  has(key: string) {
    return this.entries.has(key);
  }

  apply(key: string, cx: number, cz: number, data: ChunkMeshData) {
    let entry = this.entries.get(key);
    if (!entry) {
      const group = new THREE.Group();
      group.position.set(cx * CHUNK_WIDTH, 0, cz * CHUNK_WIDTH);
      group.add(this.createWater());
      this.root.add(group);
      this.entries.set(key, (entry = { group, meshes: [] }));
    }
    for (const m of entry.meshes) {
      entry.group.remove(m);
      m.geometry.dispose();
    }
    entry.meshes = [];

    const layers: [MeshLayer, boolean, number][] = [
      [data.opaque, true, 0],
      [data.cutout, true, 0],
      [data.transparent, false, 1],
    ];
    for (const [layer, shadows, order] of layers) {
      const geometry = toGeometry(layer);
      if (!geometry) continue;
      const mesh = new THREE.Mesh(geometry, this.materials);
      mesh.castShadow = shadows;
      mesh.receiveShadow = true;
      mesh.renderOrder = order;
      entry.group.add(mesh);
      entry.meshes.push(mesh);
    }
  }

  remove(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return;
    for (const m of entry.meshes) m.geometry.dispose();
    this.root.remove(entry.group);
    this.entries.delete(key);
  }

  dispose() {
    for (const key of [...this.entries.keys()]) this.remove(key);
  }

  private createWater() {
    const mesh = new THREE.Mesh(waterGeometry, waterMaterial);
    mesh.rotateX(-Math.PI / 2);
    mesh.position.set(CHUNK_WIDTH / 2, this.waterY(), CHUNK_WIDTH / 2);
    mesh.scale.set(CHUNK_WIDTH, CHUNK_WIDTH, 1);
    mesh.layers.set(1);
    return mesh;
  }
}
