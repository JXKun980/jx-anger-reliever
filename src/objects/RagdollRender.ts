import type { VictimParts } from "./VictimArt";
import type { Ragdoll } from "../systems/Ragdoll";

function angleDown(fx: number, fy: number, tx: number, ty: number): number {
  return Math.atan2(-(tx - fx), ty - fy);
}

export function renderRagdoll(p: VictimParts, r: Ragdoll): void {
  const n = r.nodes;

  p.head.x = n.head.x;
  p.head.y = n.head.y;
  p.head.rotation = angleDown(n.head.x, n.head.y, n.chest.x, n.chest.y);

  p.torso.x = (n.chest.x + n.hips.x) / 2;
  p.torso.y = (n.chest.y + n.hips.y) / 2;
  p.torso.rotation = angleDown(n.chest.x, n.chest.y, n.hips.x, n.hips.y);

  p.armLeft.x = n.shoulderL.x;
  p.armLeft.y = n.shoulderL.y;
  p.armLeft.rotation = angleDown(n.shoulderL.x, n.shoulderL.y, n.handL.x, n.handL.y);
  p.armRight.x = n.shoulderR.x;
  p.armRight.y = n.shoulderR.y;
  p.armRight.rotation = angleDown(n.shoulderR.x, n.shoulderR.y, n.handR.x, n.handR.y);

  const lhx = n.hips.x - 30;
  const rhx = n.hips.x + 30;
  p.legLeft.x = lhx;
  p.legLeft.y = n.hips.y;
  p.legLeft.rotation = angleDown(lhx, n.hips.y, n.footL.x, n.footL.y);
  p.legRight.x = rhx;
  p.legRight.y = n.hips.y;
  p.legRight.rotation = angleDown(rhx, n.hips.y, n.footR.x, n.footR.y);
}
