import { COMBO } from "../constants";

export class ComboSystem {
  count = 0;
  best = 0;
  private timer = 0;

  constructor() {
    const stored = Number(localStorage.getItem("bestCombo") ?? "0");
    this.best = Number.isFinite(stored) ? stored : 0;
  }

  registerHit(): void {
    this.count++;
    this.timer = COMBO.decayMs;
    if (this.count > this.best) {
      this.best = this.count;
      localStorage.setItem("bestCombo", String(this.best));
    }
  }

  /** Escalating hit strength as the combo climbs. */
  strength(): number {
    return 1 + Math.min(this.count, COMBO.maxStrengthHits) * COMBO.strengthPerHit;
  }

  reset(): void {
    this.count = 0;
    this.timer = 0;
  }

  update(dt: number): void {
    if (this.count === 0) return;
    this.timer -= dt * 1000;
    if (this.timer <= 0) this.count = 0;
  }
}
