import Phaser from "phaser";
import { HIT, SPRING, VIRTUAL } from "../constants";
import type { FaceState, HitResult } from "../types";
import { Spring1D } from "../systems/Spring";
import { Ragdoll } from "../systems/Ragdoll";
import { buildVictim, type VictimParts } from "./VictimArt";
import { renderRagdoll } from "./RagdollRender";

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
  private bodyY = new Spring1D(SPRING.stiffness * 0.9, SPRING.damping);

  private ragdoll = new Ragdoll();
  private ko = false;

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

  isKO(): boolean {
    return this.ko;
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

    // Zones across body width: left 40% | middle 20% | right 40%. A side hit
    // reads as a blow FROM that side and knocks the body the opposite way; a
    // centre hit is frontal and is knocked straight back.
    const frac = Phaser.Math.Clamp(lx / HIT.bodyHalfWidth, -1, 1);
    const s = strength;

    if (frac < -0.2) {
      this.sideKnock(1, s);
    } else if (frac > 0.2) {
      this.sideKnock(-1, s);
    } else {
      this.frontKnock(s);
    }

    this.showFace("ow", 260 + s * 120);

    const dirX = frac < -0.2 ? 1 : frac > 0.2 ? -1 : 0;
    return { part, x: worldX, y: worldY, dirX, strength: s };
  }

  private sideKnock(dir: number, s: number): void {
    this.headX.kick(dir * HIT.baseImpulse * s);
    this.headY.kick(-HIT.vertImpulse * 0.7 * s);
    this.headRot.kick(dir * HIT.rotImpulse * s);
    this.torsoX.kick(dir * HIT.baseImpulse * HIT.torsoFactor * s);
    this.torsoRot.kick(dir * HIT.rotImpulse * 0.4 * s);
    this.armL.kick(dir * HIT.armFactor * s);
    this.armR.kick(dir * HIT.armFactor * s);
    this.bodyX.kick(dir * HIT.baseImpulse * 0.25 * s);
    this.bodyY.kick(-HIT.vertImpulse * 0.35 * s);
  }

  private frontKnock(s: number): void {
    const jitter = (Math.random() * 2 - 1) * 40;
    this.headX.kick(jitter * s);
    this.headY.kick(-HIT.vertImpulse * 1.3 * s);
    this.headRot.kick((Math.random() < 0.5 ? -1 : 1) * HIT.rotImpulse * 0.3 * s);
    this.torsoRot.kick(0);
    this.bodyX.kick(jitter * 0.4 * s);
    this.bodyY.kick(-HIT.vertImpulse * 1.6 * s);
    this.armL.kick(HIT.armFactor * 0.6 * s);
    this.armR.kick(-HIT.armFactor * 0.6 * s);
  }

  knockout(dir: number): void {
    this.ko = true;
    this.ragdoll.seed();
    this.ragdoll.topple(dir === 0 ? (Math.random() < 0.5 ? -1 : 1) : dir);
    this.showFace("dizzy", 0);
  }

  poke(worldX: number, worldY: number, power: number): void {
    this.ragdoll.poke(worldX - REST_X, worldY - REST_Y, power);
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
      this.bodyY,
    ]) {
      sp.reset();
    }
    this.ko = false;
    this.parts.root.setPosition(REST_X, REST_Y);
    this.parts.root.setRotation(0);
    this.showFace("idle", 0);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.ko) {
      this.ragdoll.update(dt);
      this.parts.root.setPosition(REST_X, REST_Y);
      renderRagdoll(this.parts, this.ragdoll);
      this.parts.shadow.y = 340;
      this.parts.shadow.setAlpha(0.15);
      return;
    }
    this.parts.shadow.setAlpha(0.25);
    this.stepSprings(dt);
    this.renderStanding();
    this.tickFace(dt);
  }

  private stepSprings(dt: number): void {
    this.headX.update(dt, SPRING.maxOffset);
    this.headY.update(dt, SPRING.maxOffset);
    this.headRot.update(dt, SPRING.maxRot);
    this.torsoX.update(dt, SPRING.maxOffset * 0.5);
    this.torsoRot.update(dt, SPRING.maxRot * 0.5);
    this.armL.update(dt, SPRING.maxRot);
    this.armR.update(dt, SPRING.maxRot);
    this.bodyX.update(dt, SPRING.maxOffset);
    this.bodyY.update(dt, SPRING.maxOffset);
  }

  private renderStanding(): void {
    const settled = this.headX.atRest && this.headY.atRest && this.torsoRot.atRest;
    const breathe = settled ? Math.sin(this.t * 2) * 3 : 0;

    const tr = this.torsoRot.value;
    const tx = this.torsoX.value;
    const cos = Math.cos(tr);
    const sin = Math.sin(tr);

    const p = this.parts;
    p.root.x = REST_X + this.bodyX.value;
    p.root.y = REST_Y + this.bodyY.value;
    p.root.rotation = 0;

    p.torso.x = tx;
    p.torso.y = breathe * 0.5;
    p.torso.rotation = tr;

    p.head.x = tx + 210 * sin + this.headX.value;
    p.head.y = -210 * cos + this.headY.value + breathe;
    p.head.rotation = this.headRot.value + tr;

    this.placeJoint(p.armLeft, -104, -70, tx, cos, sin, this.armL.value + tr);
    this.placeJoint(p.armRight, 104, -70, tx, cos, sin, -this.armR.value + tr);
    this.placeJoint(p.legLeft, -42, 108, tx, cos, sin, tr * 0.4);
    this.placeJoint(p.legRight, 42, 108, tx, cos, sin, tr * 0.4);

    p.shadow.y = 340 - this.bodyY.value;
    p.shadow.setScale(
      1 - (Math.abs(this.bodyX.value) + Math.abs(this.bodyY.value)) / 900,
    );
  }

  private placeJoint(
    obj: Phaser.GameObjects.Container,
    ox: number,
    oy: number,
    tx: number,
    cos: number,
    sin: number,
    rotation: number,
  ): void {
    obj.x = tx + ox * cos - oy * sin;
    obj.y = oy * cos + ox * sin;
    obj.rotation = rotation;
  }

  private tickFace(dt: number): void {
    if (this.faceTimer > 0) {
      this.faceTimer -= dt * 1000;
      if (this.faceTimer <= 0 && this.faceState !== "idle") {
        this.showFace("idle", 0);
      }
    }
  }
}

export { REST_X, REST_Y };
