import * as THREE from 'three';
import { waterSurfaceY } from '../engine/world/DimensionConfig';
import { World, WorldListener } from '../engine/world/World';
import { meshChunk } from './ChunkMesher';
import { ChunkRenderer } from './ChunkRenderer';
import { buildMeshInput } from './MeshInput';
import { buildMeshTables, materialTable } from './MeshTables';
import { RenderAdapter } from './RenderAdapter';

interface Job {
  x: number;
  z: number;
  urgent: boolean;
}

const keyOf = (x: number, z: number) => `${x},${z}`;
const FRAME_BUDGET_MS = 6;

export class WorldRenderer implements RenderAdapter, WorldListener {
  private tables = buildMeshTables(); // must run before materialTable is read
  private chunks: ChunkRenderer;
  private queue = new Map<string, Job>();

  constructor(private world: World) {
    this.chunks = new ChunkRenderer(materialTable, () =>
      waterSurfaceY(world.params),
    );
    world.listener = this;
  }

  mount(scene: THREE.Scene) {
    scene.add(this.chunks.root);
  }

  unmount() {
    this.chunks.root.removeFromParent();
    this.chunks.dispose();
  }

  // --- WorldListener ---

  chunkChanged(x: number, z: number, urgent: boolean) {
    const key = keyOf(x, z);
    const prev = this.queue.get(key);
    this.queue.set(key, { x, z, urgent: urgent || !!prev?.urgent });
  }

  chunkUnloaded(x: number, z: number) {
    const key = keyOf(x, z);
    this.queue.delete(key);
    this.chunks.remove(key);
  }

  // --- per frame ---

  update() {
    const start = performance.now();
    while (this.queue.size > 0) {
      const job = this.nextJob();
      this.queue.delete(keyOf(job.x, job.z));

      const input = buildMeshInput(this.world, job.x, job.z);
      if (input) {
        this.chunks.apply(
          keyOf(job.x, job.z),
          job.x,
          job.z,
          meshChunk(input, this.tables),
        );
      }

      // Edits always finish this frame. Background chunks respect the budget.
      if (!job.urgent && performance.now() - start > FRAME_BUDGET_MS) break;
    }
  }

  /** Urgent first, then nearest to the player */
  private nextJob(): Job {
    let best!: Job;
    let bestScore = Infinity;
    for (const job of this.queue.values()) {
      const d =
        (job.x - this.world.centreX) ** 2 + (job.z - this.world.centreZ) ** 2;
      const score = job.urgent ? d - 1e9 : d;
      if (score < bestScore) {
        best = job;
        bestScore = score;
      }
    }
    return best;
  }
}
