/**
 * Damped-spring integrator (semi-implicit Euler for stability).
 * Each body part is a spring around its rest pose. A hit `kick`s velocity;
 * the spring overshoots slightly then snaps back = cartoon "boing".
 */
export class Spring1D {
  value = 0;
  velocity = 0;

  constructor(
    private stiffness: number,
    private damping: number,
    public target = 0,
  ) {}

  kick(v: number): void {
    this.velocity += v;
  }

  reset(): void {
    this.value = 0;
    this.velocity = 0;
  }

  /** @param dt seconds; @param clamp optional absolute clamp on value */
  update(dt: number, clamp?: number): void {
    const force =
      -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += force * dt;
    this.value += this.velocity * dt;
    if (clamp !== undefined) {
      if (this.value > clamp) {
        this.value = clamp;
        if (this.velocity > 0) this.velocity = 0;
      } else if (this.value < -clamp) {
        this.value = -clamp;
        if (this.velocity < 0) this.velocity = 0;
      }
    }
  }

  get atRest(): boolean {
    return Math.abs(this.value) < 0.05 && Math.abs(this.velocity) < 0.05;
  }
}
