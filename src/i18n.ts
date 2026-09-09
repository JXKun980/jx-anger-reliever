export type Lang = "zh" | "en";

export interface Strings {
  heal: string;
  face: string;
  mute: string;
  unmute: string;
  rage: string;
  langLabel: string; // label shown ON the toggle = the language you'd switch TO
  settingsTitle: string;
  nameLabel: string;
  photoLabel: string;
  choosePhoto: string;
  removePhoto: string;
  volumeLabel: string;
  soundLabel: string;
  languageLabel: string;
  closeLabel: string;
  onLabel: string;
  offLabel: string;
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
    settingsTitle: "设置",
    nameLabel: "角色名字",
    photoLabel: "角色照片",
    choosePhoto: "选择照片",
    removePhoto: "移除照片",
    volumeLabel: "音量",
    soundLabel: "声音",
    languageLabel: "语言",
    closeLabel: "关闭",
    onLabel: "开",
    offLabel: "关",
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
    settingsTitle: "Settings",
    nameLabel: "Character name",
    photoLabel: "Character photo",
    choosePhoto: "Choose photo",
    removePhoto: "Remove photo",
    volumeLabel: "Volume",
    soundLabel: "Sound",
    languageLabel: "Language",
    closeLabel: "Close",
    onLabel: "On",
    offLabel: "Off",
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
