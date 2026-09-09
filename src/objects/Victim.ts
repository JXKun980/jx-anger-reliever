import Phaser from "phaser";
import { HIT, SPRING, VIRTUAL } from "../constants";
import type { FaceState, HitResult } from "../types";
import { Spring1D } from "../systems/Spring";
import { buildVictim, type VictimParts } from "./VictimArt";

const REST_X = VIRTUAL.width / 2;
const REST_Y = VIRTUAL.height * 0.58;

export class Victim {
  readonly parts: VictimParts;

  private headX = new Spring1D(SPRING.stiffness, SPRING.damping);
  private headY = new Spring1D(SPRING.stiffness, SPRING.damping);
  private headRot = new Spring1D(SPRING.rotStiffness, SPRING.rotDamping);
  private torsoX = new Spring1D(SPRING.stiffness * 1.4, SPRING.damping * 1.2);
  private torsoRot = new Spring1D(SPRING.rotStiffness * 1.3, SPRING.rotDamping * 1.2);
  private armL = new Spring1D(SPRING.rotStiffness * 0.7, SPRING.rotDamping * 0.8);
  private armR = new Spring1D(SPRING.rotStiffness * 0.7, SPRING.rotDamping * 0.8);
  private bodyX = new Spring1D(SPRING.stiffness * 0.9, SPRING.damping);

  private t = 0;
  private faceState: FaceState = "idle";
  private faceTimer = 0;

  constructor(private scene: Phaser.Scene) {
    this.parts = buildVictim(scene, REST_X, REST_Y);
  }

  get container(): Phaser.GameObjects.Container {
    return this.parts.root;
  }

  get headRadius(): number {
    return this.parts.headRadius;
  }

  /** World point of the head center, for FX spawning. */
  headWorld(): { x: number; y: number } {
    return {
      x: this.parts.root.x + this.parts.head.x + this.headX.value,
      y: this.parts.root.y + this.parts.head.y + this.headY.value,
    };
  }

  /** Convert a world tap into per-part spring kicks. Returns hit metadata. */
  resolveHit(worldX: number, worldY: number, strength: number): HitResult {
    const lx = worldX - this.parts.root.x;
    const ly = worldY - this.parts.root.y;

    const headLocalY = this.parts.head.y;
    const distHead = Math.hypot(lx, ly - headLocalY);
    let part: HitResult["part"] = "body";
    if (distHead < this.headRadius + 30) part = "head";
    else if (ly < 130 && Math.abs(lx) < 120) part = "torso";
    else if (Math.abs(lx) > 90) part = "arm";

    // Direction: push head away from the tap horizontally, and up (uppercut).
    let dirX = lx === 0 ? (Math.random() < 0.5 ? -1 : 1) : -Math.sign(lx);
    dirX = Phaser.Math.Clamp(dirX * (0.5 + Math.abs(lx) / 160), -1.4, 1.4);

    const s = strength;
    this.headX.kick(dirX * HIT.baseImpulse * s);
    this.headY.kick(-HIT.vertImpulse * s);
    this.headRot.kick(dirX * HIT.rotImpulse * s);
    this.torsoX.kick(dirX * HIT.baseImpulse * HIT.torsoFactor * s);
    this.torsoRot.kick(dirX * HIT.rotImpulse * 0.4 * s);
    this.armL.kick(dirX * HIT.armFactor * s);
    this.armR.kick(dirX * HIT.armFactor * s);
    this.bodyX.kick(dirX * HIT.baseImpulse * 0.25 * s);

    this.showFace("ow", 260 + s * 120);

    return { part, x: worldX, y: worldY, dirX, strength: s };
  }

  /** Big multi-part reaction when the rage meter fills. */
  bigReaction(): void {
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.headX.kick(dir * HIT.baseImpulse * 2.2);
    this.headY.kick(-HIT.vertImpulse * 2.4);
    this.headRot.kick(dir * HIT.rotImpulse * 2.5);
    this.torsoRot.kick(dir * HIT.rotImpulse * 1.2);
    this.bodyX.kick(dir * HIT.baseImpulse);
    this.armL.kick(dir * 2.4);
    this.armR.kick(-dir * 2.4);
    this.showFace("dizzy", 1100);
  }

  private showFace(state: FaceState, ms: number): void {
    this.faceState = state;
    this.faceTimer = ms;
    this.parts.setFace(state);
  }

  applyFaceTexture(key: string): void {
    const img = this.scene.add.image(0, 0, key);
    const d = this.headRadius * 2 - 6;
    const scale = d / Math.max(img.width, img.height);
    img.setScale(scale);
    const mask = this.scene.add
      .graphics()
      .fillStyle(0xffffff)
      .fillCircle(0, 0, this.headRadius - 4);
    mask.setVisible(false);
    // Position mask at head world center each is static enough at rest.
    const hw = this.headWorld();
    mask.setPosition(hw.x, hw.y);
    img.setMask(mask.createGeometryMask());
    this.parts.setFaceImage(img);
  }

  clearFaceTexture(): void {
    this.parts.setFaceImage(null);
  }

  reset(): void {
    for (const sp of [
      this.headX,
      this.headY,
      this.headRot,
      this.torsoX,
      this.torsoRot,
      this.armL,
      this.armR,
      this.bodyX,
    ]) {
      sp.reset();
    }
    this.showFace("idle", 0);
  }

  update(dt: number): void {
    this.t += dt;
    this.headX.update(dt, SPRING.maxOffset);
    this.headY.update(dt, SPRING.maxOffset);
    this.headRot.update(dt, SPRING.maxRot);
    this.torsoX.update(dt, SPRING.maxOffset * 0.5);
    this.torsoRot.update(dt, SPRING.maxRot * 0.5);
    this.armL.update(dt, SPRING.maxRot);
    this.armR.update(dt, SPRING.maxRot);
    this.bodyX.update(dt, SPRING.maxOffset);

    // Idle breathing when settled.
    const settled = this.headX.atRest && this.headY.atRest && this.torsoRot.atRest;
    const breathe = settled ? Math.sin(this.t * 2) * 3 : 0;

    const p = this.parts;
    p.root.x = REST_X + this.bodyX.value;
    p.head.x = this.headX.value;
    p.head.y = -210 + this.headY.value + breathe;
    p.head.rotation = this.headRot.value;
    p.torso.x = this.torsoX.value;
    p.torso.rotation = this.torsoRot.value;
    p.torso.y = breathe * 0.5;
    p.armLeft.rotation = this.armL.value;
    p.armRight.rotation = -this.armR.value;
    p.shadow.scaleX = 1 - Math.abs(this.bodyX.value) / 900;

    if (this.faceTimer > 0) {
      this.faceTimer -= dt * 1000;
      if (this.faceTimer <= 0 && this.faceState !== "idle") {
        this.showFace("idle", 0);
      }
    }
  }
}

export { REST_X, REST_Y };
