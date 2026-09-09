import { getLang, setLang, t, type Lang } from "../i18n";
import { el, field, pillButton, rangeSlider, setFieldLabel, textInput } from "./dom";

export interface SettingsCallbacks {
  getName: () => string;
  setName: (name: string) => void;
  getVolume: () => number;
  setVolume: (v: number) => void;
  getSoundOn: () => boolean;
  setSoundOn: (on: boolean) => void;
  onLanguageChange: (lang: Lang) => void;
  pickPhoto: () => void;
  clearPhoto: () => void;
  getHairHue: () => number;
  setHairHue: (h: number) => void;
  getHairSat: () => number;
  setHairSat: (s: number) => void;
  getShirtHue: () => number;
  setShirtHue: (h: number) => void;
  getShirtSat: () => number;
  setShirtSat: (s: number) => void;
  getPantsHue: () => number;
  setPantsHue: (h: number) => void;
  getPantsSat: () => number;
  setPantsSat: (s: number) => void;
  getSkinTone: () => number;
  setSkinTone: (t: number) => void;
  exportCode: () => string;
  importCode: (code: string) => boolean;
}

const HUE_GRADIENT =
  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";
const SKIN_GRADIENT = "linear-gradient(to right, #ffe0bd, #8a5a3c, #4a2c1a)";
const PLACEHOLDER = "linear-gradient(to right, #000, #fff)";

const PANEL_BG = "#1b2030";
const ACCENT = "#4f8cff";
const GREEN = "#33c46b";

export class SettingsModal {
  private backdrop: HTMLDivElement;
  private panel: HTMLDivElement;
  private title: HTMLDivElement;
  private nameInput: HTMLInputElement;
  private nameField: HTMLDivElement;
  private photoField: HTMLDivElement;
  private chooseBtn: HTMLButtonElement;
  private removeBtn: HTMLButtonElement;
  private volumeField: HTMLDivElement;
  private volumeSlider: HTMLInputElement;
  private soundField: HTMLDivElement;
  private soundBtn: HTMLButtonElement;
  private hairField: HTMLDivElement;
  private hairSlider: HTMLInputElement;
  private hairSatField: HTMLDivElement;
  private hairSatSlider: HTMLInputElement;
  private topField: HTMLDivElement;
  private topSlider: HTMLInputElement;
  private topSatField: HTMLDivElement;
  private topSatSlider: HTMLInputElement;
  private bottomField: HTMLDivElement;
  private bottomSlider: HTMLInputElement;
  private bottomSatField: HTMLDivElement;
  private bottomSatSlider: HTMLInputElement;
  private skinField: HTMLDivElement;
  private skinSlider: HTMLInputElement;
  private shareField: HTMLDivElement;
  private shareInput: HTMLInputElement;
  private copyBtn: HTMLButtonElement;
  private importBtn: HTMLButtonElement;
  private shareStatus: HTMLDivElement;
  private langField: HTMLDivElement;
  private zhBtn: HTMLButtonElement;
  private enBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  constructor(private cb: SettingsCallbacks) {
    this.backdrop = el("div", {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.55)",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
      fontFamily: "system-ui, sans-serif",
    });
    this.panel = el("div", {
      width: "min(88vw, 420px)",
      maxHeight: "88vh",
      overflowY: "auto",
      background: PANEL_BG,
      borderRadius: "20px",
      padding: "22px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      color: "#fff",
      boxSizing: "border-box",
    });
    this.title = el("div", { fontSize: "24px", fontWeight: "700", marginBottom: "18px" });

    this.nameInput = textInput();
    this.nameInput.maxLength = 24;
    this.nameField = field(this.nameInput);

    this.chooseBtn = pillButton(ACCENT);
    this.removeBtn = pillButton("#3a3f55");
    const photoRow = el("div", { display: "flex", gap: "10px" });
    photoRow.append(this.chooseBtn, this.removeBtn);
    this.photoField = field(photoRow);

    this.volumeSlider = rangeSlider(PLACEHOLDER, 100);
    this.volumeSlider.style.background = "#3a3f55";
    this.volumeField = field(this.volumeSlider);

    this.soundBtn = pillButton(GREEN);
    this.soundField = field(this.soundBtn);

    this.hairSlider = rangeSlider(HUE_GRADIENT, 360);
    this.hairField = field(this.hairSlider);
    this.hairSatSlider = rangeSlider(PLACEHOLDER, 100);
    this.hairSatField = field(this.hairSatSlider);
    this.topSlider = rangeSlider(HUE_GRADIENT, 360);
    this.topField = field(this.topSlider);
    this.topSatSlider = rangeSlider(PLACEHOLDER, 100);
    this.topSatField = field(this.topSatSlider);
    this.bottomSlider = rangeSlider(HUE_GRADIENT, 360);
    this.bottomField = field(this.bottomSlider);
    this.bottomSatSlider = rangeSlider(PLACEHOLDER, 100);
    this.bottomSatField = field(this.bottomSatSlider);
    this.skinSlider = rangeSlider(SKIN_GRADIENT, 100);
    this.skinField = field(this.skinSlider);

    this.shareInput = textInput();
    this.copyBtn = pillButton(ACCENT);
    this.importBtn = pillButton("#3a3f55");
    this.shareStatus = el("div", {
      fontSize: "13px",
      color: "#8ad6a0",
      marginTop: "6px",
      minHeight: "16px",
    });
    const shareBtns = el("div", { display: "flex", gap: "10px", marginTop: "10px" });
    shareBtns.append(this.copyBtn, this.importBtn);
    const shareWrap = el("div", {});
    shareWrap.append(this.shareInput, shareBtns, this.shareStatus);
    this.shareField = field(shareWrap);

    this.zhBtn = pillButton(ACCENT);
    this.enBtn = pillButton("#3a3f55");
    const langRow = el("div", { display: "flex", gap: "10px" });
    langRow.append(this.zhBtn, this.enBtn);
    this.langField = field(langRow);

    this.closeBtn = pillButton("#3a3f55");
    this.closeBtn.style.marginTop = "8px";
    this.closeBtn.style.width = "100%";

    this.panel.append(
      this.title,
      this.nameField,
      this.photoField,
      this.volumeField,
      this.soundField,
      this.hairField,
      this.hairSatField,
      this.topField,
      this.topSatField,
      this.bottomField,
      this.bottomSatField,
      this.skinField,
      this.shareField,
      this.langField,
      this.closeBtn,
    );
    this.backdrop.append(this.panel);
    document.body.append(this.backdrop);

    this.wire();
  }

  private updateSatGradients(): void {
    const grad = (hue: number): string =>
      `linear-gradient(to right, #000, hsl(${Math.round(hue)}, 80%, 55%))`;
    this.hairSatSlider.style.background = grad(this.cb.getHairHue());
    this.topSatSlider.style.background = grad(this.cb.getShirtHue());
    this.bottomSatSlider.style.background = grad(this.cb.getPantsHue());
  }

  private flashStatus(msg: string, good: boolean): void {
    this.shareStatus.textContent = msg;
    this.shareStatus.style.color = good ? "#8ad6a0" : "#ff8a8a";
  }

  private async copyShareCode(): Promise<void> {
    const code = this.shareInput.value;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      this.shareInput.select();
      document.execCommand("copy");
    }
    this.flashStatus(t().copiedLabel, true);
  }

  private doImport(): void {
    if (this.cb.importCode(this.shareInput.value)) {
      this.populate();
      this.flashStatus(t().importOk, true);
    } else {
      this.flashStatus(t().importFail, false);
    }
  }

  private wire(): void {
    this.backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === this.backdrop) this.close();
    });
    this.nameInput.addEventListener("input", () => this.cb.setName(this.nameInput.value));
    this.chooseBtn.addEventListener("click", () => this.cb.pickPhoto());
    this.removeBtn.addEventListener("click", () => this.cb.clearPhoto());
    this.volumeSlider.addEventListener("input", () =>
      this.cb.setVolume(Number(this.volumeSlider.value) / 100),
    );
    this.hairSlider.addEventListener("input", () => {
      this.cb.setHairHue(Number(this.hairSlider.value));
      this.updateSatGradients();
    });
    this.hairSatSlider.addEventListener("input", () =>
      this.cb.setHairSat(Number(this.hairSatSlider.value) / 100),
    );
    this.topSlider.addEventListener("input", () => {
      this.cb.setShirtHue(Number(this.topSlider.value));
      this.updateSatGradients();
    });
    this.topSatSlider.addEventListener("input", () =>
      this.cb.setShirtSat(Number(this.topSatSlider.value) / 100),
    );
    this.bottomSlider.addEventListener("input", () => {
      this.cb.setPantsHue(Number(this.bottomSlider.value));
      this.updateSatGradients();
    });
    this.bottomSatSlider.addEventListener("input", () =>
      this.cb.setPantsSat(Number(this.bottomSatSlider.value) / 100),
    );
    this.skinSlider.addEventListener("input", () =>
      this.cb.setSkinTone(Number(this.skinSlider.value) / 100),
    );
    this.soundBtn.addEventListener("click", () => {
      this.cb.setSoundOn(!this.cb.getSoundOn());
      this.render();
    });
    this.copyBtn.addEventListener("click", () => void this.copyShareCode());
    this.importBtn.addEventListener("click", () => this.doImport());
    this.zhBtn.addEventListener("click", () => this.switchLang("zh"));
    this.enBtn.addEventListener("click", () => this.switchLang("en"));
    this.closeBtn.addEventListener("click", () => this.close());
  }

  private switchLang(lang: Lang): void {
    setLang(lang);
    this.cb.onLanguageChange(lang);
    this.render();
  }

  private render(): void {
    const s = t();
    this.title.textContent = s.settingsTitle;
    setFieldLabel(this.nameField, s.nameLabel);
    setFieldLabel(this.photoField, s.photoLabel);
    setFieldLabel(this.volumeField, s.volumeLabel);
    setFieldLabel(this.soundField, s.soundLabel);
    setFieldLabel(this.hairField, s.hairColorLabel);
    setFieldLabel(this.hairSatField, s.hairSatLabel);
    setFieldLabel(this.topField, s.topColorLabel);
    setFieldLabel(this.topSatField, s.topSatLabel);
    setFieldLabel(this.bottomField, s.bottomColorLabel);
    setFieldLabel(this.bottomSatField, s.bottomSatLabel);
    setFieldLabel(this.skinField, s.skinColorLabel);
    setFieldLabel(this.shareField, s.shareLabel);
    setFieldLabel(this.langField, s.languageLabel);
    this.chooseBtn.textContent = s.choosePhoto;
    this.removeBtn.textContent = s.removePhoto;
    this.copyBtn.textContent = s.copyLabel;
    this.importBtn.textContent = s.importLabel;
    this.closeBtn.textContent = s.closeLabel;

    const on = this.cb.getSoundOn();
    this.soundBtn.textContent = on ? s.onLabel : s.offLabel;
    this.soundBtn.style.background = on ? GREEN : "#3a3f55";

    const lang = getLang();
    this.zhBtn.textContent = "中文";
    this.enBtn.textContent = "English";
    this.zhBtn.style.background = lang === "zh" ? ACCENT : "#3a3f55";
    this.enBtn.style.background = lang === "en" ? ACCENT : "#3a3f55";
  }

  private populate(): void {
    this.nameInput.value = this.cb.getName();
    this.volumeSlider.value = String(Math.round(this.cb.getVolume() * 100));
    this.hairSlider.value = String(Math.round(this.cb.getHairHue()));
    this.hairSatSlider.value = String(Math.round(this.cb.getHairSat() * 100));
    this.topSlider.value = String(Math.round(this.cb.getShirtHue()));
    this.topSatSlider.value = String(Math.round(this.cb.getShirtSat() * 100));
    this.bottomSlider.value = String(Math.round(this.cb.getPantsHue()));
    this.bottomSatSlider.value = String(Math.round(this.cb.getPantsSat() * 100));
    this.skinSlider.value = String(Math.round(this.cb.getSkinTone() * 100));
    this.shareInput.value = this.cb.exportCode();
    this.shareStatus.textContent = "";
    this.updateSatGradients();
  }

  open(): void {
    this.populate();
    this.render();
    this.backdrop.style.display = "flex";
  }

  close(): void {
    this.backdrop.style.display = "none";
  }

  isOpen(): boolean {
    return this.backdrop.style.display !== "none";
  }
}
