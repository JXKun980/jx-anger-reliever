import Phaser from "phaser";
import { COLORS, VIRTUAL } from "../constants";
import { RegKey } from "../types";
import { t, toggleLang } from "../i18n";
import type { GameScene } from "./GameScene";

interface UiButton {
  bounds: Phaser.Geom.Rectangle;
}

export class UIScene extends Phaser.Scene {
  private comboText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private rageBar!: Phaser.GameObjects.Graphics;
  private rageLabel!: Phaser.GameObjects.Text;
  private healLabel!: Phaser.GameObjects.Text;
  private faceLabel!: Phaser.GameObjects.Text;
  private muteLabel!: Phaser.GameObjects.Text;
  private langLabel!: Phaser.GameObjects.Text;
  private buttons: UiButton[] = [];
  private faceCleared = true;
  private muted = false;

  constructor() {
    super("UIScene");
  }

  private game_(): GameScene {
    return this.scene.get("GameScene") as GameScene;
  }

  create(): void {
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
      .setDepth(100);

    this.bestText = this.add
      .text(VIRTUAL.width / 2, 332, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: "#9aa3c0",
      })
      .setOrigin(0.5);

    this.rageBar = this.add.graphics().setDepth(100);

    this.rageLabel = this.add
      .text(40, 44, t().rage, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ff8a8a",
      })
      .setOrigin(0, 0.5);

    this.langLabel = this.makeButton(
      VIRTUAL.width - 68,
      50,
      104,
      64,
      t().langLabel,
      () => this.onLang(),
    );

    this.healLabel = this.makeButton(150, 1210, 220, 90, t().heal, () =>
      this.game_().healReset(),
    );
    this.faceLabel = this.makeButton(VIRTUAL.width - 150, 1210, 220, 90, t().face, () =>
      this.onFace(),
    );
    this.muteLabel = this.makeButton(
      VIRTUAL.width / 2,
      1210,
      180,
      90,
      t().mute,
      () => this.onMute(),
    );

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

  private onLang(): void {
    toggleLang();
    this.rageLabel.setText(t().rage);
    this.healLabel.setText(t().heal);
    this.faceLabel.setText(t().face);
    this.muteLabel.setText(this.muted ? t().unmute : t().mute);
    this.langLabel.setText(t().langLabel);
    this.updateHud();
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
    this.muted = this.game_().toggleMute();
    this.muteLabel.setText(this.muted ? t().unmute : t().mute);
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
    const rage = Number(this.registry.get(RegKey.Rage) ?? 0);
    const x = 180;
    const y = 44;
    const w = 380;
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
