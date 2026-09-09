export type Lang = "zh" | "en";

export interface Strings {
  heal: string;
  face: string;
  mute: string;
  unmute: string;
  health: string;
  langLabel: string; // label shown ON the toggle = the language you'd switch TO
  settingsTitle: string;
  nameLabel: string;
  photoLabel: string;
  choosePhoto: string;
  removePhoto: string;
  volumeLabel: string;
  soundLabel: string;
  languageLabel: string;
  hairColorLabel: string;
  hairSatLabel: string;
  topColorLabel: string;
  topSatLabel: string;
  bottomColorLabel: string;
  bottomSatLabel: string;
  skinColorLabel: string;
  shareLabel: string;
  copyLabel: string;
  copiedLabel: string;
  importLabel: string;
  importOk: string;
  importFail: string;
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
    health: "生命值",
    langLabel: "EN",
    settingsTitle: "设置",
    nameLabel: "角色名字",
    photoLabel: "角色照片",
    choosePhoto: "选择照片",
    removePhoto: "移除照片",
    volumeLabel: "音量",
    soundLabel: "声音",
    languageLabel: "语言",
    hairColorLabel: "头发颜色",
    hairSatLabel: "头发饱和度",
    topColorLabel: "上衣颜色",
    topSatLabel: "上衣饱和度",
    bottomColorLabel: "裤子颜色",
    bottomSatLabel: "裤子饱和度",
    skinColorLabel: "肤色",
    shareLabel: "分享代码",
    copyLabel: "复制",
    copiedLabel: "已复制!",
    importLabel: "导入",
    importOk: "已导入!",
    importFail: "无效代码",
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
    health: "HEALTH",
    langLabel: "中",
    settingsTitle: "Settings",
    nameLabel: "Character name",
    photoLabel: "Character photo",
    choosePhoto: "Choose photo",
    removePhoto: "Remove photo",
    volumeLabel: "Volume",
    soundLabel: "Sound",
    languageLabel: "Language",
    hairColorLabel: "Hair colour",
    hairSatLabel: "Hair saturation",
    topColorLabel: "Top colour",
    topSatLabel: "Top saturation",
    bottomColorLabel: "Bottom colour",
    bottomSatLabel: "Bottom saturation",
    skinColorLabel: "Skin colour",
    shareLabel: "Share code",
    copyLabel: "Copy",
    copiedLabel: "Copied!",
    importLabel: "Import",
    importOk: "Imported!",
    importFail: "Invalid code",
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
