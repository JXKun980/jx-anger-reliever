export type Lang = "zh" | "en";

export interface Strings {
  heal: string;
  face: string;
  mute: string;
  unmute: string;
  rage: string;
  langLabel: string; // label shown ON the toggle = the language you'd switch TO
  combo: (n: number) => string;
  best: (n: number) => string;
  words: string[];
  wordsRage: string[];
}

const STRINGS: Record<Lang, Strings> = {
  zh: {
    heal: "治疗",
    face: "换脸",
    mute: "静音",
    unmute: "取消静音",
    rage: "怒气值",
    langLabel: "EN",
    combo: (n) => `${n}连击`,
    best: (n) => `最高 ${n}连击`,
    words: ["砰!", "哎哟!", "嘭!", "咚!", "哐!", "啪!", "痛!"],
    wordsRage: ["超级!", "击倒!", "爆炸!", "完蛋了!"],
  },
  en: {
    heal: "HEAL",
    face: "FACE",
    mute: "MUTE",
    unmute: "UNMUTE",
    rage: "RAGE",
    langLabel: "中",
    combo: (n) => `${n}x`,
    best: (n) => `BEST ${n}x`,
    words: ["POW!", "OW!", "BONK!", "OOF!", "WHAM!", "SMACK!"],
    wordsRage: ["MEGA!", "K.O.!", "BOOM!", "OBLITERATED!"],
  },
};

let current: Lang = readInitial();

function readInitial(): Lang {
  const stored = localStorage.getItem("lang");
  return stored === "en" ? "en" : "zh"; // default to Chinese
}

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang): void {
  current = l;
  localStorage.setItem("lang", l);
}

export function toggleLang(): Lang {
  setLang(current === "zh" ? "en" : "zh");
  return current;
}

/** Current string table. */
export function t(): Strings {
  return STRINGS[current];
}
