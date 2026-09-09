import { RAGDOLL } from "../constants";

export interface RNode {
  x: number;
  y: number;
  px: number;
  py: number;
}

interface Stick {
  a: string;
  b: string;
  len: number;
}

export type NodeName =
  | "head"
  | "chest"
  | "hips"
  | "shoulderL"
  | "shoulderR"
  | "handL"
  | "handR"
  | "footL"
  | "footR";

const REST: Record<NodeName, [number, number]> = {
  head: [0, -210],
  chest: [0, -90],
  hips: [0, 110],
  shoulderL: [-104, -70],
  shoulderR: [104, -70],
  handL: [-104, 90],
  handR: [104, 90],
  footL: [-42, 320],
  footR: [42, 320],
};

const LINKS: [NodeName, NodeName][] = [
  ["head", "chest"],
  ["head", "hips"],
  ["chest", "hips"],
  ["chest", "shoulderL"],
  ["chest", "shoulderR"],
  ["shoulderL", "shoulderR"],
  ["shoulderL", "handL"],
  ["shoulderR", "handR"],
  ["hips", "footL"],
  ["hips", "footR"],
];

function dist(a: RNode, b: RNode): number {
  return Math.hypot(b.x - a.x, b.y - a.y) || 0.0001;
}

/** Verlet-integrated stick ragdoll in the character's local coordinate space. */
export class Ragdoll {
  readonly nodes: Record<NodeName, RNode> = {} as Record<NodeName, RNode>;
  private sticks: Stick[] = [];

  seed(): void {
    for (const name of Object.keys(REST) as NodeName[]) {
      const [x, y] = REST[name];
      this.nodes[name] = { x, y, px: x, py: y };
    }
    this.sticks = LINKS.map(([a, b]) => ({
      a,
      b,
      len: dist(this.nodes[a], this.nodes[b]),
    }));
  }

  /** Impart a toppling impulse toward dir (+1 right, -1 left). */
  topple(dir: number): void {
    const upper: NodeName[] = ["head", "chest", "shoulderL", "shoulderR", "handL", "handR"];
    for (const n of upper) {
      this.nodes[n].px -= dir * RAGDOLL.toppleX;
      this.nodes[n].py += RAGDOLL.toppleUp;
    }
    this.nodes.head.px -= dir * RAGDOLL.toppleX * 0.6;
  }

  /** Nudge the nearest node toward a local point (poking the downed body). */
  poke(lx: number, ly: number, power: number): void {
    let best: NodeName = "chest";
    let bestD = Infinity;
    for (const name of Object.keys(this.nodes) as NodeName[]) {
      const n = this.nodes[name];
      const d = (n.x - lx) ** 2 + (n.y - ly) ** 2;
      if (d < bestD) {
        bestD = d;
        best = name;
      }
    }
    const n = this.nodes[best];
    const dx = n.x - lx;
    const dy = n.y - ly;
    const m = Math.hypot(dx, dy) || 1;
    n.px -= (dx / m) * power;
    n.py -= (dy / m) * power;
  }

  update(dt: number): void {
    const g = RAGDOLL.gravity * dt * dt;
    for (const name of Object.keys(this.nodes) as NodeName[]) {
      const n = this.nodes[name];
      const vx = (n.x - n.px) * RAGDOLL.damping;
      const vy = (n.y - n.py) * RAGDOLL.damping;
      n.px = n.x;
      n.py = n.y;
      n.x += vx;
      n.y += vy + g;
    }
    for (let i = 0; i < RAGDOLL.iterations; i++) {
      for (const s of this.sticks) {
        const a = this.nodes[s.a as NodeName];
        const b = this.nodes[s.b as NodeName];
        const d = dist(a, b);
        const diff = ((d - s.len) / d) * 0.5;
        const ox = (b.x - a.x) * diff;
        const oy = (b.y - a.y) * diff;
        a.x += ox;
        a.y += oy;
        b.x -= ox;
        b.y -= oy;
      }
      for (const name of Object.keys(this.nodes) as NodeName[]) {
        const n = this.nodes[name];
        if (n.y > RAGDOLL.floorY) {
          n.y = RAGDOLL.floorY;
          n.px = n.x - (n.x - n.px) * RAGDOLL.friction;
        }
        if (n.x < RAGDOLL.minX) {
          n.x = RAGDOLL.minX;
          n.px = n.x - (n.x - n.px) * RAGDOLL.friction;
        } else if (n.x > RAGDOLL.maxX) {
          n.x = RAGDOLL.maxX;
          n.px = n.x - (n.x - n.px) * RAGDOLL.friction;
        }
      }
    }
  }
}
