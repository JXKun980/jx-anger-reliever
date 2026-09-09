import { RAGE } from "../constants";

export class RageMeter {
  value = 0;
  private cooldown = 0;
  onFull: (() => void) | null = null;

  addHit(): void {
    this.value = Math.min(1, this.value + RAGE.perHit);
    if (this.value >= 1 && this.cooldown <= 0) {
      this.cooldown = RAGE.fullReactionCooldownMs;
      this.value = 0;
      this.onFull?.();
    }
  }

  reset(): void {
    this.value = 0;
    this.cooldown = 0;
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt * 1000;
    if (this.value > 0) {
      this.value = Math.max(0, this.value - RAGE.drainPerSec * dt);
    }
  }
}
