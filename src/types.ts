export type BodyPart = "head" | "torso" | "arm" | "body";

export type FaceState = "idle" | "ow" | "dizzy";

export interface HitResult {
  part: BodyPart;
  x: number;
  y: number;
  dirX: number;
  strength: number;
}

export const enum RegKey {
  Combo = "combo",
  Best = "best",
  Rage = "rage",
}
