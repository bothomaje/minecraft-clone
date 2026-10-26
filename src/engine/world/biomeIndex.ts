export const AXES = ['temperature', 'humidity', 'elevation'] as const;
export type Axis = (typeof AXES)[number];
export type Point = readonly [
  temperature: number,
  humidity: number,
  elevation: number,
];
export type Range = readonly [min: number, max: number];
export type Box = Partial<Record<Axis, Range>>;

const WEIGHT: Record<Axis, number> = {
  temperature: 1,
  humidity: 1,
  elevation: 1 / 16,
};

/**
 * Finds the entry whose box is closest to a point, by weighted squared distance
 * to the box (0 inside it). Ties go to the earlier entry. This is how Minecraft
 * picks biomes: boxes may overlap or leave gaps, and the closest one still wins.
 *
 * A linear scan is used on purpose: with a few dozen boxes it costs about as much
 * as one noise sample. If the table grows to hundreds of boxes, swap the body of
 * `find` for a k-d tree or R-tree without touching callers.
 */
export class BoxIndex<T> {
  private readonly lo: Float64Array;
  private readonly hi: Float64Array;
  private readonly weight = AXES.map((axis) => WEIGHT[axis]);
  private readonly values: T[] = [];

  constructor(entries: ReadonlyArray<{ value: T; boxes: readonly Box[] }>) {
    const boxes: { value: T; box: Box }[] = entries.flatMap(
      ({ value, boxes }) => boxes.map((box) => ({ value, box })),
    );
    this.lo = new Float64Array(boxes.length * AXES.length);
    this.hi = new Float64Array(boxes.length * AXES.length);

    boxes.forEach(({ value, box }, i) => {
      this.values.push(value);
      AXES.forEach((axis, a) => {
        const [min, max] = box[axis] ?? [-Infinity, Infinity];
        this.lo[i * AXES.length + a] = min;
        this.hi[i * AXES.length + a] = max;
      });
    });
  }

  find(point: Point): T {
    const dims = AXES.length;
    let best = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < this.values.length; i++) {
      let cost = 0;
      for (let a = 0; a < dims; a++) {
        const v = point[a];
        const lo = this.lo[i * dims + a];
        const hi = this.hi[i * dims + a];
        const distance = v < lo ? lo - v : v > hi ? v - hi : 0;
        cost += (distance * this.weight[a]) ** 2;
        if (cost >= best) break;
      }
      if (cost < best) {
        best = cost;
        bestIndex = i;
        if (cost === 0) break;
      }
    }
    return this.values[bestIndex];
  }
}
