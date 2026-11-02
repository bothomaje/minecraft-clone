export class FixedStep {
  private acc = 0;
  private step = 1 / 60;
  private maxSteps = 5;

  constructor(step = 1 / 60, maxSteps = 5) {
    this.step = step;
    this.maxSteps = maxSteps;
  }

  run(delta: number, tick: (dt: number) => void) {
    this.acc += Math.min(delta, this.step * this.maxSteps);
    while (this.acc >= this.step) {
      tick(this.step);
      this.acc -= this.step;
    }
  }
}
