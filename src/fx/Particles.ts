import Phaser from "phaser";
import { COLORS } from "../constants";

const STAR = "px_star";
const SWEAT = "px_sweat";
const TOOTH = "px_tooth";

export function generateTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(STAR)) return;

  const star = scene.add.graphics();
  star.fillStyle(COLORS.star, 1);
  drawStar(star, 16, 16, 5, 15, 7);
  star.generateTexture(STAR, 32, 32);
  star.destroy();

  const sweat = scene.add.graphics();
  sweat.fillStyle(COLORS.sweat, 1);
  sweat.fillCircle(10, 12, 8);
  sweat.fillTriangle(10, 0, 4, 10, 16, 10);
  sweat.generateTexture(SWEAT, 20, 22);
  sweat.destroy();

  const tooth = scene.add.graphics();
  tooth.fillStyle(COLORS.tooth, 1);
  tooth.fillRoundedRect(2, 2, 14, 16, 4);
  tooth.generateTexture(TOOTH, 18, 20);
  tooth.destroy();
}

function drawStar(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  points: number,
  outer: number,
  inner: number,
): void {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}

function oneShot(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  count: number,
  speed: [number, number],
  gravityY: number,
): void {
  const emitter = scene.add.particles(x, y, key, {
    speed: { min: speed[0], max: speed[1] },
    angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    lifespan: 550,
    gravityY,
    emitting: false,
  });
  emitter.setDepth(50);
  emitter.explode(count);
  scene.time.delayedCall(650, () => emitter.destroy());
}

export function hitBurst(scene: Phaser.Scene, x: number, y: number, big: boolean): void {
  oneShot(scene, x, y, STAR, big ? 18 : 8, [180, big ? 520 : 340], 300);
  oneShot(scene, x, y, SWEAT, big ? 8 : 3, [120, 300], 500);
  if (big || Math.random() < 0.25) {
    oneShot(scene, x, y, TOOTH, big ? 3 : 1, [160, 360], 700);
  }
}
