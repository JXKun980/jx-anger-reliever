export const VIRTUAL = { width: 720, height: 1280 };

export const COLORS = {
  bg: 0x1b2030,
  bgBottom: 0x12141c,
  floor: 0x272d40,
  shadow: 0x000000,
  skin: 0xffcc99,
  skinShade: 0xe0a877,
  shirt: 0x4f8cff,
  shirtShade: 0x2f6ad9,
  pants: 0x3a3f55,
  pantsShade: 0x2a2e40,
  hair: 0x5a3a29,
  eyeWhite: 0xffffff,
  pupil: 0x22242e,
  mouth: 0x7a2b2b,
  star: 0xffd54a,
  sweat: 0x7fd4ff,
  tooth: 0xffffff,
  bruise: 0x8e5fb0,
  rage: 0xff4d4d,
  rageBg: 0x33384d,
  healthHigh: 0x33c46b,
  healthMid: 0xf5c542,
  healthLow: 0xff4d4d,
  healthBg: 0x33384d,
  text: 0xffffff,
  textStroke: 0x22242e,
  button: 0x2f3550,
  buttonText: 0xffffff,
};

// Damped spring: snappy return with a touch of overshoot for the "boing".
export const SPRING = {
  stiffness: 220,
  damping: 13,
  maxOffset: 260,
  rotStiffness: 180,
  rotDamping: 11,
  maxRot: 1.9,
};

export const HIT = {
  baseImpulse: 820,
  vertImpulse: 380,
  rotImpulse: 14,
  freezeMs: 55,
  shakeBase: 0.008,
  shakeMax: 0.04,
  flashMs: 90,
  torsoFactor: 0.5,
  armFactor: 1.4,
  bodyHalfWidth: 170,
};

export const RAGDOLL = {
  floorY: 265,
  gravity: 2600,
  damping: 0.99,
  friction: 0.72,
  iterations: 8,
  toppleX: 7,
  toppleUp: 10,
  minX: -270,
  maxX: 270,
};

export const COMBO = { decayMs: 1200, strengthPerHit: 0.04, maxStrengthHits: 20 };

export const RAGE = {
  perHit: 0.06,
  drainPerSec: 0.04,
  fullReactionCooldownMs: 900,
};

export const HEALTH = {
  damagePerHit: 0.06,
  koCooldownMs: 900,
};

export const BRUISE = {
  maxVisible: 12,
  healPerSec: 0.15,
  addChance: 0.55,
  baseAlpha: 0.55,
};
