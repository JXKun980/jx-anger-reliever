# Anger Reliever — Implementation Plan

A cartoonish web game: tap/click a cartoon guy ("me") and he reacts with a
satisfying **springy** force recoil, full juice (screen shake, particles,
sounds, combo, rage meter, bruises). Optional: drop in a photo of a real face
(stays on-device). Ships as a static PWA.

This document is **decision-complete**. Build it top-to-bottom. Do not
re-litigate design choices — they are settled below. Where a value is given
(e.g. a spring constant), use it; tune only in the final polish step.

---

## 0. Settled decisions (do not change)

| Decision | Choice |
|---|---|
| Engine | Phaser 3 (`phaser` npm, v3.80+) |
| Language | TypeScript (strict) |
| Bundler / dev server | Vite (v5+) |
| Physics for recoil | **Custom damped-spring model** (NOT Matter.js). Springy, stays on-model. |
| Rendering of character | **Procedural** — drawn from Phaser shapes/Graphics. No image assets required. |
| Photo drop-in | Optional. Uploaded image is read locally via `FileReader` → used as head texture. Never uploaded anywhere. Falls back to a drawn generic face. |
| Audio | **Procedural Web Audio** (synthesized pow/boing/ow). No audio asset files. |
| Reaction style | Springy recoil that snaps back (NOT ragdoll flop). |
| Scope | Full juice (combo, rage meter, special full-rage reaction, accumulating bruises, reset/heal). |
| Deploy | Static site (Vercel/Netlify/GitHub Pages), PWA manifest for "add to home screen". |
| Target | Mobile finger tap + laptop click. 60fps. Fully offline-capable. |

**Constraints**: No `any`, no `@ts-ignore`. Keep every file under ~250 LOC — if a
file grows past that, split it. Multi-touch must work (rapid two-finger tapping =
two hits). Everything must run with `npm run dev` and build with `npm run build`.

---

## 1. Final file tree

```
anger-reliver/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── public/
│   ├── manifest.webmanifest
│   └── icons/
│       ├── icon-192.png        (placeholder; a solid-color square is fine for v1)
│       └── icon-512.png
└── src/
    ├── main.ts                 Phaser.Game bootstrap + config
    ├── constants.ts            All tuning numbers, colors, virtual resolution
    ├── types.ts                Shared TS types/interfaces
    ├── scenes/
    │   ├── GameScene.ts        Owns the Victim, input, FX orchestration, systems
    │   └── UIScene.ts          HUD overlay: combo, rage bar, reset button, upload button
    ├── objects/
    │   └── Victim.ts           The cartoon character: parts + spring update + hit resolve
    ├── systems/
    │   ├── Spring.ts           Reusable 1D/2D damped-spring integrator
    │   ├── ComboSystem.ts      Combo count + decay timer
    │   ├── RageMeter.ts        Rage fill + full-rage trigger
    │   └── BruiseLayer.ts      Accumulating lumps/bruises decals + heal
    ├── fx/
    │   ├── Juice.ts            Screen shake, freeze-frame, hit-flash, floating text
    │   └── Particles.ts        Star / sweat / tooth burst emitters (generated textures)
    ├── audio/
    │   └── AudioManager.ts     Web Audio synth: pow / boing / ow, unlock on first tap
    └── util/
        └── FaceUpload.ts       File input → HTMLImageElement → Phaser texture
```

---

## 2. Config files (write these verbatim-ish)

### `package.json`
```json
{
  "name": "anger-reliver",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": []
  },
  "include": ["src"]
}
```

### `vite.config.ts`
```ts
import { defineConfig } from "vite";
export default defineConfig({
  base: "./",              // relative paths so it works on GitHub Pages subpaths
  build: { target: "es2020" },
});
```

### `index.html`
Minimal. `<div id="game">`, full-viewport, no scroll, `touch-action: none` on the
game container to prevent mobile browser gestures from stealing taps. Include
`<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">`.
Link the manifest. Load `src/main.ts` as a module.

Key CSS:
```css
html,body{margin:0;height:100%;overflow:hidden;background:#12141c;overscroll-behavior:none}
#game{width:100vw;height:100vh;touch-action:none;user-select:none}
canvas{display:block}
```

### `.gitignore`
```
node_modules
dist
*.local
```

---

## 3. `src/constants.ts` — all tuning in one place

```ts
export const VIRTUAL = { width: 720, height: 1280 }; // portrait design canvas

export const COLORS = {
  bg: 0x1b2030,
  skin: 0xffc', /* replace with 0xffcc99 */
  skinShade: 0xe0a877,
  shirt: 0x4f8cff,
  shirtShade: 0x2f6ad9,
  pants: 0x3a3f55,
  hair: 0x5a3a29,
  star: 0xffd54a,
  sweat: 0x7fd4ff,
  tooth: 0xffffff,
  bruise: 0x8e5fb0,
  rage: 0xff4d4d,
  rageBg: 0x33384d,
  text: 0xffffff,
};

// Spring: critically-ish damped, snappy return. Tune in polish.
export const SPRING = {
  stiffness: 220,   // higher = snappier return
  damping: 18,      // higher = less wobble
  maxOffset: 140,   // clamp part displacement (px)
  rotStiffness: 180,
  rotDamping: 14,
};

// Hit
export const HIT = {
  baseImpulse: 520,       // px/s applied to head/torso per tap
  rotImpulse: 9,          // rad/s spin kick
  freezeMs: 45,           // freeze-frame duration
  shakeBase: 0.006,       // camera shake intensity at combo 1
  shakeMax: 0.03,
  flashMs: 90,
};

export const COMBO = { decayMs: 1200 };     // time before combo resets
export const RAGE = { perHit: 0.06, drainPerSec: 0.04, fullReactionCooldownMs: 900 };
export const BRUISE = { maxVisible: 12, healPerSec: 0.15 };
```
> NOTE: fix the placeholder `skin: 0xffcc99` (the snippet above has a typo marker).
> All colors are `0xRRGGBB` ints.

---

## 4. `src/main.ts`

- Create `Phaser.Game` with:
  - `type: Phaser.AUTO`
  - `parent: "game"`
  - `backgroundColor: COLORS.bg`
  - `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: VIRTUAL.width, height: VIRTUAL.height }`
  - `scene: [GameScene, UIScene]`
  - `input: { activePointers: 3 }`  ← enables multi-touch (3 simultaneous taps)
  - `render: { antialias: true }`
- Launch `GameScene`; `GameScene` will `scene.launch("UIScene")` so UI runs as a
  parallel overlay scene.

---

## 5. `src/systems/Spring.ts` — the heart of the feel

A tiny reusable damped-spring integrator. Semi-implicit Euler for stability.

```ts
// 1D spring toward target (default 0 = rest)
export class Spring1D {
  value = 0; velocity = 0;
  constructor(private stiffness: number, private damping: number, public target = 0) {}
  kick(v: number) { this.velocity += v; }
  update(dt: number) {
    const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += force * dt;
    this.value += this.velocity * dt;
  }
}
```
- Provide a `Spring2D` (two `Spring1D` for x/y) OR just use two `Spring1D`
  instances in `Victim`.
- `dt` is seconds (`delta / 1000` from Phaser update).
- Clamp `value` to `±SPRING.maxOffset` after update to avoid runaway.

**Why springs, not Matter**: springy on-model recoil. Each body part is a
`Spring` around its rest pose. A tap = `kick()` on the relevant springs. They
overshoot slightly then snap back = the cartoon "boing".

---

## 6. `src/objects/Victim.ts` — the character

### Construction (procedural, no assets)
Build the guy as a `Phaser.GameObjects.Container` centered at
`(VIRTUAL.width/2, VIRTUAL.height*0.58)`. Draw parts as child containers so each
can be transformed independently:

- **legs** (two rounded rects, `pants` color) — mostly static, tiny wobble.
- **torso** (rounded rect, `shirt` color, with a `shirtShade` side) — springs.
- **arms** (two rounded rects hanging from shoulders) — springy, dangle on hit.
- **head** (circle, `skin`) — the main springy part. Springs x/y + rotation.
- **face** (drawn on the head container): two eyes (white circles + pupils),
  eyebrows, a mouth. Expose a method `setFace(state)` with states:
  `"idle" | "ow" | "dizzy"`. `ow` = X eyes / open mouth; `dizzy` = spiral eyes at
  full rage.
- **hair** simple arcs on top.

Use `Phaser.GameObjects.Graphics` to draw rounded rects/circles into each part
container once at construction (or use `scene.add.ellipse` / `add.rectangle`
game objects — simpler, no redraw). Prefer the shape game objects
(`add.rectangle`, `add.ellipse`, `add.arc`) for crisp transforms.

### Photo head
- If a face texture key exists (set by `FaceUpload`), overlay a
  `scene.add.image` on the head, circular-masked to the head radius, instead of
  (or on top of) the drawn face. Keep the drawn face as fallback.
- Provide `applyFaceTexture(key: string)` and `clearFaceTexture()`.

### Springs held by Victim
- `headX`, `headY` : `Spring1D`
- `headRot`        : `Spring1D` (rotStiffness/rotDamping)
- `torsoX`, `torsoRot`
- `armSwingL`, `armSwingR` (rotation springs)
- Optional whole-body lean spring for big hits.

### `resolveHit(worldX, worldY, strength)` → `HitResult`
1. Convert world tap to local space relative to the character container.
2. Determine which part was hit (head vs torso vs arm) by bounding regions.
   Return the part name so FX/audio can vary.
3. Compute a direction vector from the character's vertical axis to the tap →
   the head gets kicked **away** from the tap horizontally, and **up** slightly
   (uppercut feel). Vertical taps near the chin = bigger vertical kick.
4. `headX.kick(dir.x * HIT.baseImpulse * strength)`
   `headY.kick(-HIT.baseImpulse * 0.5 * strength)`
   `headRot.kick(dir.x * HIT.rotImpulse * strength)` (spin in hit direction)
   torso/arms get smaller fractional kicks.
5. Return `{ part, x: worldX, y: worldY, dirX: dir.x }` for the FX layer.

`strength` scales with combo (harder hits as combo rises) — pass it in from
GameScene: `strength = 1 + Math.min(combo, 20) * 0.04`.

### `update(dt)`
- Step every spring.
- Apply spring outputs to the display objects:
  - head container `x = restX + headX.value`, `y = restY + headY.value`,
    `rotation = headRot.value`.
  - torso `rotation = torsoRot.value`, small `x` offset.
  - arms `rotation = rest ± armSwing.value`.
- Add a subtle idle breathing/bob when velocities are ~0 (sine on time) so he
  looks alive at rest.

### Full-rage special reaction
- Method `bigReaction()`: apply a large multi-part kick, set face `dizzy`, spin
  head more, spawn a bigger particle burst (caller does particles). Used when
  RageMeter fills.

---

## 7. `src/fx/Particles.ts`

Generate textures at boot (no image files):
- **star**: draw a 5-point star into a `Phaser.Textures` canvas texture, key `"px_star"`.
- **sweat**: a teardrop / small blue circle, key `"px_sweat"`.
- **tooth**: a tiny white rounded square, key `"px_tooth"`.

Expose:
- `burst(x, y, kind, count)` — creates a short-lived emitter (Phaser 3.60+
  `scene.add.particles(x, y, key, {...})`) with gravityY, random angle/speed,
  scale-down + alpha-fade over ~500ms, then `emitter.stop()` and destroy on
  complete. Use `explode(count)` for one-shot.
- On a normal hit: 6–10 stars + 3 sweat. On big/critical: add 1–2 teeth.

Pool/clean up emitters so they don't leak (destroy after lifespan).

---

## 8. `src/fx/Juice.ts`

- `shake(scene, intensity, ms)` → `scene.cameras.main.shake(ms, intensity)`.
  Intensity = `lerp(shakeBase, shakeMax, min(combo,25)/25)`.
- `flash(target)` → briefly tint the hit part white then tween back over
  `HIT.flashMs` (use `setTintFill` on shape objects, or a white overlay alpha
  tween).
- `freezeFrame(scene, ms)` → set `scene.physics`? No physics; instead briefly
  set a `frozen` flag in GameScene that skips `victim.update` for `ms`, OR use
  `scene.time.timeScale`/tween pause. Simplest: GameScene holds `freezeUntil`
  timestamp; skip spring stepping while `now < freezeUntil`. Keep it ≤ 50ms so it
  reads as impact, not lag.
- `floatingText(scene, x, y, text)` → spawn a `scene.add.text` with a punchy
  style (bold, outlined), random slight rotation, tween it up + fade + scale
  pop, destroy on complete. Words: rotate through `["POW!","OW!","BONK!","OOF!",
  "WHAM!","YEET!"]`; at full rage use `["MEGA!","KO!","💥"]`.

---

## 9. `src/audio/AudioManager.ts`

Pure Web Audio (`new AudioContext()`), no asset files. Must **resume on first
user gesture** (mobile autoplay policy) — call `ctx.resume()` inside the first
`pointerdown`.

Provide:
- `unlock()` — resume context; call once on first input.
- `pow()` — short noise burst through a lowpass + a fast pitch-down sine "thump"
  (~120ms). Layer: white-noise buffer via a gain envelope (attack 2ms, decay
  ~100ms) + an oscillator sweeping 180→60Hz.
- `boing()` — a sine/triangle osc with a quick downward pitch glide plus a small
  vibrato LFO (~180→90Hz over 250ms), medium gain envelope. This is the springy
  "boi-oing".
- `ow()` — a very short bandpass-filtered sawtooth around 300–500Hz with fast
  decay to fake a cartoon voice yelp.
- Randomize pitch ±10% per call so repeats don't feel robotic.
- On each hit: play `pow()` + `boing()` together; occasionally `ow()`.
- Respect a `muted` flag (UIScene mute toggle optional; at least expose it).

Keep total simultaneous nodes bounded; disconnect nodes on envelope end.

---

## 10. Systems

### `src/systems/ComboSystem.ts`
- `count: number`, `best: number` (persist `best` to `localStorage`).
- `registerHit()` → `count++`, reset a decay timer to `COMBO.decayMs`.
- `update(dt)` → if no hit within `decayMs`, reset `count` to 0.
- Emit/callback on change so UIScene updates.

### `src/systems/RageMeter.ts`
- `value: 0..1`.
- `addHit()` → `value = min(1, value + RAGE.perHit)`. When it reaches 1: fire
  `onFull()` callback (GameScene triggers `victim.bigReaction()` + big particles
  + strong shake), then reset to 0 with a `fullReactionCooldownMs` guard.
- `update(dt)` → slowly drain by `RAGE.drainPerSec` when idle.

### `src/systems/BruiseLayer.ts`
- A container over the character. On hit, with some probability, add a bruise
  decal (ellipse, `bruise` color, low alpha) at the local hit point; cap at
  `BRUISE.maxVisible` (recycle oldest).
- `update(dt)` → fade all bruises slowly (`healPerSec`); remove when invisible.
- `healAll()` → clear immediately (called by reset button).

---

## 11. `src/scenes/GameScene.ts` — orchestrator

`create()`:
1. Draw background (gradient rect or two-tone; add a simple floor line + shadow
   ellipse under the character).
2. `Particles.generateTextures(this)`.
3. `this.victim = new Victim(this)`.
4. Instantiate `ComboSystem`, `RageMeter`, `BruiseLayer`, `AudioManager`.
5. Wire `RageMeter.onFull = () => { victim.bigReaction(); Particles.burst(...big); Juice.shake(strong); }`.
6. Input: `this.input.on("pointerdown", (p) => this.onHit(p))`. Because
   `activePointers:3`, each finger fires its own `pointerdown` → multi-hit works.
7. `scene.launch("UIScene")` and pass references (via registry or `scene.get`).
8. Expose combo/rage to UIScene through the Phaser **registry**
   (`this.registry.set("combo", n)`), which UIScene reads on change events —
   this decouples the scenes cleanly.

`onHit(pointer)`:
1. `audio.unlock()` (first time), then compute `strength` from combo.
2. `const hit = victim.resolveHit(pointer.worldX, pointer.worldY, strength)`.
3. `combo.registerHit(); rage.addHit(); bruises.maybeAdd(localPoint)`.
4. FX: `Juice.freezeFrame`, `Juice.shake`, `Juice.flash(hitPart)`,
   `Juice.floatingText`, `Particles.burst`, `audio.pow()+boing()`.
5. Update registry values for the HUD.

`update(time, delta)`:
- `const dt = delta/1000`.
- If `time < freezeUntil` skip victim spring stepping (freeze-frame) but still
  allow FX timers.
- `victim.update(dt); combo.update(dt); rage.update(dt); bruises.update(dt)`.
- Push `combo.count`, `rage.value`, `combo.best` to registry.

### Hit registration precision
Taps should count **anywhere** (whole screen is a valid hit for catharsis), but
FX should originate at the tap point and the part detection biases the reaction.
Do NOT require pixel-perfect hits on the body — that's frustrating. Any tap =
a hit; if it's far from the body, treat it as a body-center hit with slightly
reduced strength.

---

## 12. `src/scenes/UIScene.ts` — HUD overlay

Runs parallel to GameScene (transparent). Reads registry, listens to
`this.registry.events.on("changedata", ...)`.

Elements:
- **Combo counter** top-center: big number, scales/pops on increment; hidden at 0.
- **Best** small, under combo.
- **Rage bar** along the top or left: rounded bar, fills `rage` value with `rage`
  color; glows/pulses near full.
- **Reset / Heal button** bottom-corner: on click → `bruises.healAll()`, reset
  combo, face back to idle, small sparkle. Give it a clear icon/label ("Heal").
- **Upload face button** bottom-corner: triggers `FaceUpload.pick()`; on success
  calls `victim.applyFaceTexture(key)`. Also a small "x" to clear back to drawn
  face.
- Optional **mute** toggle.

UI must be DOM-free where possible (Phaser text/shapes) EXCEPT the file input,
which is a real hidden `<input type="file">` (see FaceUpload). Position UI using
the same virtual resolution; anchor to screen edges.

---

## 13. `src/util/FaceUpload.ts`

- Create a hidden `<input type="file" accept="image/*">` appended to `document.body`.
- `pick()` → programmatically `.click()` it.
- On `change`: read the file with `FileReader.readAsDataURL` → create an
  `HTMLImageElement` → on load, add to Phaser textures:
  `scene.textures.addImage("faceTex", img)` → resolve a promise with the key.
- **Privacy**: never send anywhere; note this in a tiny caption near the button
  ("stays on your device"). Handle non-image / load errors gracefully (ignore).
- Provide `clear()` to remove the texture and revert.

---

## 14. `public/manifest.webmanifest` + PWA

```json
{
  "name": "Anger Reliever",
  "short_name": "Reliever",
  "start_url": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#12141c",
  "theme_color": "#1b2030",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
- v1 icons can be plain solid-color PNGs (generate any 192/512 squares).
- A service worker is **optional** for v1 (skip to keep it simple); the app is
  already fully client-side so it works offline once cached by the browser. If
  added later, precache the built assets.

---

## 15. Build order (do in this sequence)

1. Config files + `index.html` + empty `src/main.ts` that boots an empty
   `GameScene` showing the background. **Verify**: `npm install && npm run dev`,
   open browser, see the background. `npm run build` passes.
2. `constants.ts`, `types.ts`, `Spring.ts`.
3. `Victim.ts` drawn at rest (no springs yet). Verify he renders centered.
4. Wire springs + `resolveHit` + input in GameScene. Verify: clicking makes the
   head recoil and snap back. **This is the core "feel" gate — tune SPRING/HIT
   until it feels good before adding more.**
5. `Particles.ts` + `Juice.ts`; hook into `onHit`. Verify stars/shake/flash/text.
6. `AudioManager.ts`; hook in. Verify pow/boing on click (after first gesture).
7. `ComboSystem`, `RageMeter`, `BruiseLayer` + registry wiring.
8. `UIScene.ts` HUD. Verify combo counts, rage fills → special reaction fires.
9. `FaceUpload.ts` + buttons. Verify a chosen photo maps onto the head; clear
   reverts.
10. `manifest.webmanifest`, viewport/`touch-action`, multi-touch check.
11. Final polish pass: tune constants for maximum satisfaction; test on a real
    phone (or Chrome device emulation with touch).

---

## 16. Verification checklist (must all pass)

- `npm run build` exits 0 (tsc `--noEmit` clean + vite build).
- No `any`, no `@ts-ignore` in the codebase.
- Desktop click: head recoils away from click point, overshoots, snaps back;
  sound + stars + shake + floating word appear.
- Rapid clicking raises combo; combo decays after ~1.2s idle.
- Rage bar fills; at full → big special reaction (dizzy face, big burst, strong
  shake), then resets.
- Bruises accumulate and slowly heal; "Heal" button clears them + resets combo.
- Mobile (or emulated touch): single tap works; two-finger simultaneous taps =
  two hits (multi-touch). No page scroll/zoom while tapping.
- Photo upload maps onto the head and stays local; clear reverts to drawn face.
- Runs at ~60fps; particle emitters are destroyed (no leak over time).
- Loads and plays with no network after first load.

---

## 17. Nice-to-haves (only if time; not required for v1)

- Persist `best` combo and last uploaded face (as dataURL) in `localStorage`.
- Screen-edge "impact" vignette flash on big hits.
- Unlockable "weapons" (cursor changes: glove → hammer → fish) that change the
  hit sound and impulse.
- Haptics on mobile: `navigator.vibrate(20)` per hit (guard for support).
- A tiny settings gear: mute, reduce-motion (disables shake for accessibility).

---

## 18. Gotchas / notes for the executor

- **Phaser 3.60+ particle API**: `this.add.particles(x, y, textureKey, config)`
  returns an emitter directly (no separate manager). Use that signature.
- Use `pointer.worldX/worldY` (not `x/y`) so coordinates match the FIT-scaled
  virtual canvas.
- With `Scale.FIT`, all layout uses the 720×1280 virtual space regardless of the
  real device size — don't hardcode `window.innerWidth`.
- Freeze-frame must be tiny (≤50ms) or it feels like lag, not impact.
- Clamp spring displacement (`SPRING.maxOffset`) so a mash of taps can't fling
  the head off-screen.
- Keep each source file < 250 LOC; `Victim.ts` is the most likely to exceed —
  split drawing (`VictimArt`) from behavior if needed.
- `navigator.vibrate` and `AudioContext` need feature guards.
- Fix the deliberate placeholder in `constants.ts` (`skin` color) noted in §3.
```
