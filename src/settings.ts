export interface Settings {
  name: string;
  volume: number;
  soundOn: boolean;
  hairHue: number;
  hairSat: number;
  shirtHue: number;
  shirtSat: number;
  pantsHue: number;
  pantsSat: number;
  skinTone: number;
}

const DEFAULTS: Settings = {
  name: "王俊贤",
  volume: 0.8,
  soundOn: true,
  hairHue: 154,
  hairSat: 0,
  shirtHue: 238,
  shirtSat: 0.21,
  pantsHue: 228,
  pantsSat: 0.6,
  skinTone: 0.25,
};

const KEY = "settings";

function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && v >= min && v <= max ? v : fallback;
}

function coerce(p: Partial<Settings>): Settings {
  return {
    name: typeof p.name === "string" && p.name.trim() ? p.name : DEFAULTS.name,
    volume: num(p.volume, 0, 1, DEFAULTS.volume),
    soundOn: typeof p.soundOn === "boolean" ? p.soundOn : DEFAULTS.soundOn,
    hairHue: num(p.hairHue, 0, 360, DEFAULTS.hairHue),
    hairSat: num(p.hairSat, 0, 1, DEFAULTS.hairSat),
    shirtHue: num(p.shirtHue, 0, 360, DEFAULTS.shirtHue),
    shirtSat: num(p.shirtSat, 0, 1, DEFAULTS.shirtSat),
    pantsHue: num(p.pantsHue, 0, 360, DEFAULTS.pantsHue),
    pantsSat: num(p.pantsSat, 0, 1, DEFAULTS.pantsSat),
    skinTone: num(p.skinTone, 0, 1, DEFAULTS.skinTone),
  };
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return coerce(JSON.parse(raw) as Partial<Settings>);
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

function clampHue(h: number): number {
  return Math.max(0, Math.min(360, h));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function setHairHue(h: number): void {
  current.hairHue = clampHue(h);
  save();
}

export function setHairSat(s: number): void {
  current.hairSat = clamp01(s);
  save();
}

export function setShirtHue(h: number): void {
  current.shirtHue = clampHue(h);
  save();
}

export function setShirtSat(s: number): void {
  current.shirtSat = clamp01(s);
  save();
}

export function setPantsHue(h: number): void {
  current.pantsHue = clampHue(h);
  save();
}

export function setPantsSat(s: number): void {
  current.pantsSat = clamp01(s);
  save();
}

export function setSkinTone(t: number): void {
  current.skinTone = clamp01(t);
  save();
}

const CODE_PREFIX = "AR1-";

/** Serialise the character look to a shareable text code. */
export function exportSettings(): string {
  const c = current;
  const compact = {
    n: c.name,
    hh: Math.round(c.hairHue),
    hs: Math.round(c.hairSat * 100),
    th: Math.round(c.shirtHue),
    ts: Math.round(c.shirtSat * 100),
    bh: Math.round(c.pantsHue),
    bs: Math.round(c.pantsSat * 100),
    sk: Math.round(c.skinTone * 100),
  };
  const json = JSON.stringify(compact);
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(json)));
}

/** Apply a shared text code. Returns true when it parses successfully. */
export function importSettings(code: string): boolean {
  try {
    const trimmed = code.trim();
    const body = trimmed.startsWith(CODE_PREFIX)
      ? trimmed.slice(CODE_PREFIX.length)
      : trimmed;
    const json = decodeURIComponent(escape(atob(body)));
    const c = JSON.parse(json) as Record<string, unknown>;
    const merged = coerce({
      name: typeof c.n === "string" ? c.n : current.name,
      volume: current.volume,
      soundOn: current.soundOn,
      hairHue: Number(c.hh),
      hairSat: Number(c.hs) / 100,
      shirtHue: Number(c.th),
      shirtSat: Number(c.ts) / 100,
      pantsHue: Number(c.bh),
      pantsSat: Number(c.bs) / 100,
      skinTone: Number(c.sk) / 100,
    });
    Object.assign(current, merged);
    save();
    return true;
  } catch {
    return false;
  }
}
