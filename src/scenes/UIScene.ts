import Phaser from "phaser";
import { COLORS, VIRTUAL } from "../constants";
import { RegKey } from "../types";
import type { GameScene } from "./GameScene";

interface UiButton {
  bounds: Phaser.Geom.Rectangle;
}

export class UIScene extends Phaser.Scene {
  private comboText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private rageBar!: Phaser.GameObjects.Graphics;
  private muteLabel!: Phaser.GameObjects.Text;
  private buttons: UiButton[] = [];
  private faceCleared = true;

  constructor() {
    super("UIScene");
  }

  private game_(): GameScene {
    return this.scene.get("GameScene") as GameScene;
  }

  create(): void {
    this.comboText = this.add
      .text(VIRTUAL.width / 2, 150, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "120px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#22242e",
        strokeThickness: 12,
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.bestText = this.add
      .text(VIRTUAL.width / 2, 232, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: "#9aa3c0",
      })
      .setOrigin(0.5);

    this.rageBar = this.add.graphics().setDepth(100);

    this.add
      .text(160, 30, "RAGE", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ff8a8a",
      })
      .setOrigin(0, 0.5);

    this.makeButton(150, 1210, 220, 90, "HEAL", () => this.game_().healReset());
    this.makeButton(VIRTUAL.width - 150, 1210, 220, 90, "FACE", () =>
      this.onFace(),
    );
    this.muteLabel = this.makeButton(
      VIRTUAL.width / 2,
      1210,
      180,
      90,
      "MUTE",
      () => this.onMute(),
    );

    this.add
      .text(VIRTUAL.width - 150, 1268, "stays on your device", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#6b7290",
      })
      .setOrigin(0.5);

    this.registry.events.on("changedata", this.onData, this);
    this.updateHud();
  }

  private makeButton(
    cx: number,
    cy: number,
    w: number,
    h: number,
    label: string,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const g = this.add.graphics().setDepth(99);
    g.fillStyle(COLORS.button, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 20);
    const txt = this.add
      .text(cx, cy, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "36px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(100);

    const bounds = new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
    this.buttons.push({ bounds });
    const zone = this.add
      .zone(cx, cy, w, h)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => {
      txt.setScale(0.92);
    });
    zone.on("pointerup", () => {
      txt.setScale(1);
      action();
    });
    zone.on("pointerout", () => txt.setScale(1));
    return txt;
  }

  /** True if a pointer landed on a HUD button (so the game ignores it). */
  hitsUI(pointer: Phaser.Input.Pointer): boolean {
    for (const b of this.buttons) {
      if (b.bounds.contains(pointer.worldX, pointer.worldY)) return true;
    }
    return false;
  }

  private onFace(): void {
    if (this.faceCleared) {
      void this.game_()
        .pickFace()
        .then(() => {
          this.faceCleared = false;
        });
    } else {
      this.game_().clearFace();
      this.faceCleared = true;
    }
  }

  private onMute(): void {
    const muted = this.game_().toggleMute();
    this.muteLabel.setText(muted ? "UNMUTE" : "MUTE");
  }

  private onData = (_p: unknown, key: string): void => {
    if (key === RegKey.Combo || key === RegKey.Best) this.updateHud();
  };

  private updateHud(): void {
    const combo = Number(this.registry.get(RegKey.Combo) ?? 0);
    const best = Number(this.registry.get(RegKey.Best) ?? 0);
    if (combo > 1) {
      this.comboText.setText(`${combo}x`);
      const scale = 1 + Math.min(combo, 30) * 0.01;
      this.comboText.setScale(scale);
    } else {
      this.comboText.setText("");
    }
    this.bestText.setText(best > 0 ? `BEST ${best}x` : "");
  }

  update(): void {
    const rage = Number(this.registry.get(RegKey.Rage) ?? 0);
    const x = 160;
    const y = 30;
    const w = VIRTUAL.width - 320;
    const h = 26;
    const g = this.rageBar;
    g.clear();
    g.fillStyle(COLORS.rageBg, 1);
    g.fillRoundedRect(x, y - h / 2, w, h, 13);
    if (rage > 0) {
      g.fillStyle(COLORS.rage, 1);
      g.fillRoundedRect(x, y - h / 2, Math.max(h, w * rage), h, 13);
    }
    if (rage > 0.85) {
      g.lineStyle(3, 0xffffff, 0.6 + Math.sin(this.time.now / 80) * 0.3);
      g.strokeRoundedRect(x, y - h / 2, w, h, 13);
    }
  }
}
