import Phaser from "phaser";
import { COLORS, HIT, VIRTUAL } from "../constants";
import { RES } from "../res";
import { t } from "../i18n";

export function shake(scene: Phaser.Scene, combo: number, big: boolean): void {
  const t = Phaser.Math.Clamp(combo / 25, 0, 1);
  let intensity = Phaser.Math.Linear(HIT.shakeBase, HIT.shakeMax, t);
  if (big) intensity = HIT.shakeMax * 1.6;
  scene.cameras.main.shake(big ? 260 : 130, intensity);
}

export function flash(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Container,
): void {
  const overlay = scene.add.circle(
    target.x,
    target.y,
    110,
    0xffffff,
    0.7,
  );
  overlay.setDepth(40);
  scene.tweens.add({
    targets: overlay,
    alpha: 0,
    duration: HIT.flashMs,
    onComplete: () => overlay.destroy(),
  });
}

export function floatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  big: boolean,
): void {
  const pool = big ? t().wordsRage : t().words;
  const word = pool[Math.floor(Math.random() * pool.length)];
  const size = big ? 96 : 54;
  const txt = scene.add.text(x, y, word, {
    fontFamily: "system-ui, sans-serif",
    fontSize: `${size}px`,
    fontStyle: "bold",
    color: big ? "#ff4d4d" : "#ffffff",
    stroke: "#22242e",
    strokeThickness: big ? 10 : 7,
  });
  txt.setOrigin(0.5);
  txt.setResolution(RES);
  txt.setDepth(60);
  txt.setAngle(Phaser.Math.Between(-14, 14));
  txt.setScale(0.4);
  scene.tweens.add({
    targets: txt,
    scale: big ? 1.3 : 1,
    y: y - 120,
    alpha: { from: 1, to: 0 },
    ease: "Cubic.easeOut",
    duration: big ? 900 : 650,
    onComplete: () => txt.destroy(),
  });
}

export function drawBackground(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.bg, 1);
  g.fillRect(0, 0, VIRTUAL.width, VIRTUAL.height);
  g.fillStyle(COLORS.bgBottom, 1);
  g.fillRect(0, VIRTUAL.height * 0.72, VIRTUAL.width, VIRTUAL.height * 0.28);
  g.fillStyle(COLORS.floor, 1);
  g.fillRect(0, VIRTUAL.height * 0.72, VIRTUAL.width, 8);
  g.setDepth(-10);
}
