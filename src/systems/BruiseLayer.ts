import Phaser from "phaser";
import { BRUISE, COLORS } from "../constants";

interface Bruise {
  obj: Phaser.GameObjects.Ellipse;
  alpha: number;
}

/** Accumulating lumps/bruises on the head that slowly heal. */
export class BruiseLayer {
  private items: Bruise[] = [];

  constructor(
    private container: Phaser.GameObjects.Container,
    private headRadius: number,
  ) {}

  maybeAdd(scene: Phaser.Scene): void {
    if (Math.random() > BRUISE.addChance) return;
    const r = this.headRadius * (0.2 + Math.random() * 0.7);
    const a = Math.random() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.9;
    const size = 14 + Math.random() * 18;
    const obj = scene.add.ellipse(x, y, size, size * 0.8, COLORS.bruise, BRUISE.baseAlpha);
    obj.setAngle(Math.random() * 360);
    this.container.add(obj);
    this.items.push({ obj, alpha: BRUISE.baseAlpha });

    if (this.items.length > BRUISE.maxVisible) {
      const old = this.items.shift();
      old?.obj.destroy();
    }
  }

  healAll(): void {
    for (const b of this.items) b.obj.destroy();
    this.items = [];
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const b = this.items[i];
      b.alpha -= BRUISE.healPerSec * dt;
      if (b.alpha <= 0) {
        b.obj.destroy();
        this.items.splice(i, 1);
      } else {
        b.obj.setAlpha(b.alpha);
      }
    }
  }
}
