export interface Settings {
  name: string;
  volume: number;
  soundOn: boolean;
  hairHue: number;
  shirtHue: number;
  pantsHue: number;
  skinTone: number;
}

const DEFAULTS: Settings = {
  name: "王俊贤",
  volume: 0.8,
  soundOn: true,
  hairHue: 22,
  shirtHue: 217,
  pantsHue: 228,
  skinTone: 0.25,
};

const KEY = "settings";

function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && v >= min && v <= max ? v : fallback;
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      name: typeof p.name === "string" && p.name.trim() ? p.name : DEFAULTS.name,
      volume: num(p.volume, 0, 1, DEFAULTS.volume),
      soundOn: typeof p.soundOn === "boolean" ? p.soundOn : DEFAULTS.soundOn,
      hairHue: num(p.hairHue, 0, 360, DEFAULTS.hairHue),
      shirtHue: num(p.shirtHue, 0, 360, DEFAULTS.shirtHue),
      pantsHue: num(p.pantsHue, 0, 360, DEFAULTS.pantsHue),
      skinTone: num(p.skinTone, 0, 1, DEFAULTS.skinTone),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const current: Settings = load();

function save(): void {
  localStorage.setItem(KEY, JSON.stringify(current));
}

export function getSettings(): Readonly<Settings> {
  return current;
}

export function setName(name: string): void {
  current.name = name.trim() || DEFAULTS.name;
  save();
}

export function setVolume(volume: number): void {
  current.volume = Math.max(0, Math.min(1, volume));
  save();
}

export function setSoundOn(on: boolean): void {
  current.soundOn = on;
  save();
}

export function setHairHue(h: number): void {
  current.hairHue = Math.max(0, Math.min(360, h));
  save();
}

export function setShirtHue(h: number): void {
  current.shirtHue = Math.max(0, Math.min(360, h));
  save();
}

export function setPantsHue(h: number): void {
  current.pantsHue = Math.max(0, Math.min(360, h));
  save();
}

export function setSkinTone(t: number): void {
  current.skinTone = Math.max(0, Math.min(1, t));
  save();
}
