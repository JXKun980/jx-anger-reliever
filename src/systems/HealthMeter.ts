import { HEALTH } from "../constants";

export class HealthMeter {
  value = 1;
  private cooldown = 0;
  onEmpty: (() => void) | null = null;

  addHit(damage = HEALTH.damagePerHit): void {
    if (this.value <= 0) return;
    this.value = Math.max(0, this.value - damage);
    if (this.value <= 0 && this.cooldown <= 0) {
      this.cooldown = HEALTH.koCooldownMs;
      this.onEmpty?.();
    }
  }

  heal(): void {
    this.value = 1;
    this.cooldown = 0;
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt * 1000;
  }
}
