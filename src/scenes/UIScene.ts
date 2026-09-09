import Phaser from "phaser";
import { COLORS, VIRTUAL } from "../constants";
import { RES } from "../res";
import { RegKey } from "../types";
import { t } from "../i18n";
import { lerpInt } from "../util/color";
import type { GameScene } from "./GameScene";

interface UiButton {
  bounds: Phaser.Geom.Rectangle;
}

const BTN_R = 46;
const GEAR = { cx: VIRTUAL.width - 74, cy: 74 };
const HEART = { cx: VIRTUAL.width - 74, cy: 184 };

export class UIScene extends Phaser.Scene {
  private comboText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthLabel!: Phaser.GameObjects.Text;
  private buttons: UiButton[] = [];

  constructor() {
    super("UIScene");
  }

  private game_(): GameScene {
    return this.scene.get("GameScene") as GameScene;
  }

  create(): void {
    this.cameras.main.setZoom(RES);
    this.cameras.main.centerOn(VIRTUAL.width / 2, VIRTUAL.height / 2);

    this.comboText = this.add
      .text(VIRTUAL.width / 2, 250, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "100px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#22242e",
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setResolution(RES)
      .setDepth(100);

    this.bestText = this.add
      .text(VIRTUAL.width / 2, 332, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: "#9aa3c0",
      })
      .setOrigin(0.5)
      .setResolution(RES);

    this.healthBar = this.add.graphics().setDepth(100);

    this.healthLabel = this.add
      .text(40, 44, t().health, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#8ad6a0",
      })
      .setOrigin(0, 0.5)
      .setResolution(RES);

    this.makeCircleButton(GEAR.cx, GEAR.cy, "gear", () => this.game_().openSettings());
    this.makeCircleButton(HEART.cx, HEART.cy, "heart", () => this.game_().healReset());

    this.registry.events.on("changedata", this.onData, this);
    this.updateHud();
  }

  private makeCircleButton(
    cx: number,
    cy: number,
    icon: "gear" | "heart",
    action: () => void,
  ): void {
    const c = this.add.container(cx, cy).setDepth(100);
    c.add(this.add.circle(0, 0, BTN_R, COLORS.button));
    c.add(icon === "gear" ? this.drawGear() : this.drawHeart());

    this.buttons.push({
      bounds: new Phaser.Geom.Rectangle(cx - BTN_R, cy - BTN_R, BTN_R * 2, BTN_R * 2),
    });
    const zone = this.add
      .zone(cx, cy, BTN_R * 2, BTN_R * 2)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => c.setScale(0.9));
    zone.on("pointerup", () => {
      c.setScale(1);
      action();
    });
    zone.on("pointerout", () => c.setScale(1));
  }

  private drawGear(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const col = 0xcfd6e6;
    const rInner = BTN_R * 0.4;
    const rOuter = BTN_R * 0.66;
    g.lineStyle(9, col, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
      g.lineTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
      g.strokePath();
    }
    g.fillStyle(col, 1);
    g.fillCircle(0, 0, rInner + 3);
    g.fillStyle(COLORS.button, 1);
    g.fillCircle(0, 0, BTN_R * 0.19);
    return g;
  }

  private drawHeart(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const scale = BTN_R / 30;
    const cyOff = 2.5 * scale;
    const pts: Phaser.Geom.Point[] = [];
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = 16 * Math.sin(a) ** 3;
      const y =
        13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
      pts.push(new Phaser.Geom.Point(x * scale, -y * scale - cyOff));
    }
    g.fillStyle(0x2fd06b, 1);
    g.fillPoints(pts, true);
    return g;
  }

  /** True if a pointer landed on a HUD button (so the game ignores it). */
  hitsUI(pointer: Phaser.Input.Pointer): boolean {
    for (const b of this.buttons) {
      if (b.bounds.contains(pointer.worldX, pointer.worldY)) return true;
    }
    return false;
  }

  refreshLang(): void {
    this.healthLabel.setText(t().health);
    this.updateHud();
  }

  private onData = (_p: unknown, key: string): void => {
    if (key === RegKey.Combo || key === RegKey.Best) this.updateHud();
  };

  private updateHud(): void {
    const combo = Number(this.registry.get(RegKey.Combo) ?? 0);
    const best = Number(this.registry.get(RegKey.Best) ?? 0);
    if (combo > 1) {
      this.comboText.setText(t().combo(combo));
      const scale = 1 + Math.min(combo, 30) * 0.01;
      this.comboText.setScale(scale);
    } else {
      this.comboText.setText("");
    }
    this.bestText.setText(best > 0 ? t().best(best) : "");
  }

  update(): void {
    const health = Number(this.registry.get(RegKey.Health) ?? 1);
    const x = 180;
    const y = 44;
    const w = 380;
    const h = 26;
    const g = this.healthBar;
    g.clear();
    g.fillStyle(COLORS.healthBg, 1);
    g.fillRoundedRect(x, y - h / 2, w, h, 13);
    if (health > 0) {
      const col =
        health > 0.5
          ? lerpInt(COLORS.healthMid, COLORS.healthHigh, (health - 0.5) * 2)
          : lerpInt(COLORS.healthLow, COLORS.healthMid, health * 2);
      g.fillStyle(col, 1);
      g.fillRoundedRect(x, y - h / 2, Math.max(h, w * health), h, 13);
    }
    if (health > 0 && health < 0.2) {
      g.lineStyle(3, 0xffffff, 0.6 + Math.sin(this.time.now / 80) * 0.3);
      g.strokeRoundedRect(x, y - h / 2, w, h, 13);
    }
  }
}
