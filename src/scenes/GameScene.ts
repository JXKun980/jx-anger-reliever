import Phaser from "phaser";
import { HIT, VIRTUAL } from "../constants";
import { RegKey } from "../types";
import { Victim } from "../objects/Victim";
import { ComboSystem } from "../systems/ComboSystem";
import { RageMeter } from "../systems/RageMeter";
import { BruiseLayer } from "../systems/BruiseLayer";
import { AudioManager } from "../audio/AudioManager";
import { FaceUpload } from "../util/FaceUpload";
import { generateTextures, hitBurst } from "../fx/Particles";
import { drawBackground, flash, floatingText, shake } from "../fx/Juice";
import { getSettings, setName, setSoundOn, setVolume } from "../settings";
import { SettingsModal } from "../ui/SettingsModal";
import type { UIScene } from "./UIScene";

export class GameScene extends Phaser.Scene {
  private victim!: Victim;
  private combo!: ComboSystem;
  private rage!: RageMeter;
  private bruises!: BruiseLayer;
  private audio!: AudioManager;
  private faceUpload!: FaceUpload;
  private nameText!: Phaser.GameObjects.Text;
  private settingsModal!: SettingsModal;

  private freezeUntil = 0;
  private unlocked = false;
  private hitsSinceVoice = 0;
  private lastDirX = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    drawBackground(this);
    generateTextures(this);

    this.victim = new Victim(this);
    this.combo = new ComboSystem();
    this.rage = new RageMeter();
    this.audio = new AudioManager();
    this.audio.setVolume(getSettings().volume);
    this.audio.setEnabled(getSettings().soundOn);
    this.faceUpload = new FaceUpload(this);
    this.bruises = new BruiseLayer(
      this.victim.parts.bruiseLayer,
      this.victim.headRadius,
    );

    this.nameText = this.add
      .text(VIRTUAL.width / 2, 395, getSettings().name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "46px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#22242e",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.settingsModal = new SettingsModal({
      getName: () => getSettings().name,
      setName: (n) => {
        setName(n);
        this.nameText.setText(getSettings().name);
      },
      getVolume: () => getSettings().volume,
      setVolume: (v) => {
        setVolume(v);
        this.audio.unlock();
        this.audio.setVolume(v);
      },
      getSoundOn: () => getSettings().soundOn,
      setSoundOn: (on) => {
        setSoundOn(on);
        this.audio.setEnabled(on);
      },
      onLanguageChange: () => {
        const ui = this.scene.get("UIScene") as UIScene | undefined;
        ui?.refreshLang();
      },
      pickPhoto: () => void this.pickFace(),
      clearPhoto: () => this.clearFace(),
    });

    this.rage.onFull = () => {
      this.victim.knockout(this.lastDirX);
      const hw = this.victim.headWorld();
      hitBurst(this, hw.x, hw.y, true);
      floatingText(this, hw.x, hw.y - 60, true);
      shake(this, this.combo.count, true);
      this.audio.hit(true);
    };

    this.input.addPointer(2);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onHit(p));

    this.registry.set(RegKey.Combo, 0);
    this.registry.set(RegKey.Best, this.combo.best);
    this.registry.set(RegKey.Rage, 0);

    this.scene.launch("UIScene");
  }

  private onHit(pointer: Phaser.Input.Pointer): void {
    if (!this.unlocked) {
      this.audio.unlock();
      this.unlocked = true;
    }

    const ui = this.scene.get("UIScene") as UIScene | undefined;
    if (ui?.hitsUI(pointer)) return;

    if (this.victim.isKO()) {
      this.victim.poke(pointer.worldX, pointer.worldY, 18);
      this.freezeUntil = this.time.now + HIT.freezeMs;
      shake(this, 0, false);
      floatingText(this, pointer.worldX, pointer.worldY - 40, false);
      hitBurst(this, pointer.worldX, pointer.worldY, false);
      this.audio.hit(false);
      return;
    }

    this.combo.registerHit();
    const strength = this.combo.strength();
    const hit = this.victim.resolveHit(pointer.worldX, pointer.worldY, strength);
    this.lastDirX = hit.dirX;
    this.rage.addHit();
    this.bruises.maybeAdd(this);

    const big = strength > 1.5;
    this.freezeUntil = this.time.now + HIT.freezeMs;
    shake(this, this.combo.count, false);
    flash(this, this.victim.parts.head);
    floatingText(this, hit.x, hit.y - 40, false);
    hitBurst(this, hit.x, hit.y, big);

    this.hitsSinceVoice++;
    const withVoice = this.hitsSinceVoice >= 3 || Math.random() < 0.4;
    if (withVoice) this.hitsSinceVoice = 0;
    this.audio.hit(withVoice);
  }

  healReset(): void {
    this.bruises.healAll();
    this.combo.reset();
    this.rage.reset();
    this.victim.reset();
    this.registry.set(RegKey.Combo, 0);
    this.registry.set(RegKey.Rage, 0);
  }

  async pickFace(): Promise<void> {
    const key = await this.faceUpload.pick();
    if (key) this.victim.applyFaceTexture(key);
  }

  clearFace(): void {
    this.victim.clearFaceTexture();
  }

  openSettings(): void {
    this.settingsModal.open();
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;
    if (time >= this.freezeUntil) this.victim.update(dt);
    this.combo.update(dt);
    this.rage.update(dt);
    this.bruises.update(dt);

    this.registry.set(RegKey.Combo, this.combo.count);
    this.registry.set(RegKey.Best, this.combo.best);
    this.registry.set(RegKey.Rage, this.rage.value);
  }
}
