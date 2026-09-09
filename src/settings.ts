export interface Settings {
  name: string;
  volume: number;
  soundOn: boolean;
}

const DEFAULTS: Settings = {
  name: "王俊贤",
  volume: 0.8,
  soundOn: true,
};

const KEY = "settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : DEFAULTS.name,
      volume:
        typeof parsed.volume === "number" && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : DEFAULTS.volume,
      soundOn: typeof parsed.soundOn === "boolean" ? parsed.soundOn : DEFAULTS.soundOn,
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
