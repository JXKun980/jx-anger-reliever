import { getLang, setLang, t, type Lang } from "../i18n";

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
  getShirtHue: () => number;
  setShirtHue: (h: number) => void;
  getPantsHue: () => number;
  setPantsHue: (h: number) => void;
  getSkinTone: () => number;
  setSkinTone: (t: number) => void;
}

const HUE_GRADIENT =
  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";
const SKIN_GRADIENT = "linear-gradient(to right, #ffe0bd, #8a5a3c, #4a2c1a)";

const PANEL_BG = "#1b2030";
const FIELD_BG = "#12141c";
const ACCENT = "#4f8cff";
const GREEN = "#33c46b";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration>,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  return node;
}

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
  private hairField: HTMLDivElement;
  private hairSlider: HTMLInputElement;
  private topField: HTMLDivElement;
  private topSlider: HTMLInputElement;
  private bottomField: HTMLDivElement;
  private bottomSlider: HTMLInputElement;
  private skinField: HTMLDivElement;
  private skinSlider: HTMLInputElement;
  private soundField: HTMLDivElement;
  private soundBtn: HTMLButtonElement;
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
    this.title = el("div", {
      fontSize: "24px",
      fontWeight: "700",
      marginBottom: "18px",
    });

    this.nameInput = el("input", {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 14px",
      fontSize: "18px",
      borderRadius: "12px",
      border: "none",
      background: FIELD_BG,
      color: "#fff",
    });
    this.nameInput.type = "text";
    this.nameInput.maxLength = 24;
    this.nameField = this.field(this.nameInput);

    this.chooseBtn = this.button(ACCENT);
    this.removeBtn = this.button("#3a3f55");
    const photoRow = el("div", { display: "flex", gap: "10px" });
    photoRow.append(this.chooseBtn, this.removeBtn);
    this.photoField = this.field(photoRow);

    this.volumeSlider = el("input", { width: "100%" });
    this.volumeSlider.type = "range";
    this.volumeSlider.min = "0";
    this.volumeSlider.max = "100";
    this.volumeField = this.field(this.volumeSlider);

    this.hairSlider = this.colorSlider(HUE_GRADIENT, 360);
    this.hairField = this.field(this.hairSlider);
    this.topSlider = this.colorSlider(HUE_GRADIENT, 360);
    this.topField = this.field(this.topSlider);
    this.bottomSlider = this.colorSlider(HUE_GRADIENT, 360);
    this.bottomField = this.field(this.bottomSlider);
    this.skinSlider = this.colorSlider(SKIN_GRADIENT, 100);
    this.skinField = this.field(this.skinSlider);

    this.soundBtn = this.button(GREEN);
    this.soundField = this.field(this.soundBtn);

    this.zhBtn = this.button(ACCENT);
    this.enBtn = this.button("#3a3f55");
    const langRow = el("div", { display: "flex", gap: "10px" });
    langRow.append(this.zhBtn, this.enBtn);
    this.langField = this.field(langRow);

    this.closeBtn = this.button("#3a3f55");
    this.closeBtn.style.marginTop = "8px";
    this.closeBtn.style.width = "100%";

    this.panel.append(
      this.title,
      this.nameField,
      this.photoField,
      this.volumeField,
      this.soundField,
      this.hairField,
      this.topField,
      this.bottomField,
      this.skinField,
      this.langField,
      this.closeBtn,
    );
    this.backdrop.append(this.panel);
    document.body.append(this.backdrop);

    this.wire();
  }

  private field(control: HTMLElement): HTMLDivElement {
    const wrap = el("div", { marginBottom: "16px" });
    const label = el("div", {
      fontSize: "14px",
      color: "#9aa3c0",
      marginBottom: "8px",
      fontWeight: "600",
    });
    label.dataset.role = "label";
    wrap.append(label, control);
    return wrap;
  }

  private colorSlider(gradient: string, max: number): HTMLInputElement {
    const s = el("input", {
      width: "100%",
      height: "22px",
      borderRadius: "11px",
      background: gradient,
      cursor: "pointer",
      appearance: "none",
      boxSizing: "border-box",
    });
    (s.style as unknown as { webkitAppearance: string }).webkitAppearance = "none";
    s.type = "range";
    s.min = "0";
    s.max = String(max);
    return s;
  }

  private button(bg: string): HTMLButtonElement {
    return el("button", {
      flex: "1",
      padding: "12px 14px",
      fontSize: "16px",
      fontWeight: "700",
      borderRadius: "12px",
      border: "none",
      background: bg,
      color: "#fff",
      cursor: "pointer",
    });
  }

  private setLabel(field: HTMLDivElement, text: string): void {
    const label = field.querySelector<HTMLElement>('[data-role="label"]');
    if (label) label.textContent = text;
  }

  private wire(): void {
    this.backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === this.backdrop) this.close();
    });
    this.nameInput.addEventListener("input", () => this.cb.setName(this.nameInput.value));
    this.chooseBtn.addEventListener("click", () => this.cb.pickPhoto());
    this.removeBtn.addEventListener("click", () => this.cb.clearPhoto());
    this.volumeSlider.addEventListener("input", () => {
      this.cb.setVolume(Number(this.volumeSlider.value) / 100);
    });
    this.hairSlider.addEventListener("input", () => {
      this.cb.setHairHue(Number(this.hairSlider.value));
    });
    this.topSlider.addEventListener("input", () => {
      this.cb.setShirtHue(Number(this.topSlider.value));
    });
    this.bottomSlider.addEventListener("input", () => {
      this.cb.setPantsHue(Number(this.bottomSlider.value));
    });
    this.skinSlider.addEventListener("input", () => {
      this.cb.setSkinTone(Number(this.skinSlider.value) / 100);
    });
    this.soundBtn.addEventListener("click", () => {
      this.cb.setSoundOn(!this.cb.getSoundOn());
      this.render();
    });
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
    this.setLabel(this.nameField, s.nameLabel);
    this.setLabel(this.photoField, s.photoLabel);
    this.setLabel(this.volumeField, s.volumeLabel);
    this.setLabel(this.soundField, s.soundLabel);
    this.setLabel(this.hairField, s.hairColorLabel);
    this.setLabel(this.topField, s.topColorLabel);
    this.setLabel(this.bottomField, s.bottomColorLabel);
    this.setLabel(this.skinField, s.skinColorLabel);
    this.setLabel(this.langField, s.languageLabel);
    this.chooseBtn.textContent = s.choosePhoto;
    this.removeBtn.textContent = s.removePhoto;
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

  open(): void {
    this.nameInput.value = this.cb.getName();
    this.volumeSlider.value = String(Math.round(this.cb.getVolume() * 100));
    this.hairSlider.value = String(Math.round(this.cb.getHairHue()));
    this.topSlider.value = String(Math.round(this.cb.getShirtHue()));
    this.bottomSlider.value = String(Math.round(this.cb.getPantsHue()));
    this.skinSlider.value = String(Math.round(this.cb.getSkinTone() * 100));
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
