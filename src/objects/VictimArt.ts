import Phaser from "phaser";
import { COLORS } from "../constants";
import type { FaceState } from "../types";

function roundedRect(
  scene: Phaser.Scene,
  w: number,
  h: number,
  color: number,
  radius: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  return g;
}

export interface VictimParts {
  root: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  legLeft: Phaser.GameObjects.Container;
  legRight: Phaser.GameObjects.Container;
  torso: Phaser.GameObjects.Container;
  armLeft: Phaser.GameObjects.Container;
  armRight: Phaser.GameObjects.Container;
  head: Phaser.GameObjects.Container;
  headRadius: number;
  bruiseLayer: Phaser.GameObjects.Container;
  setFace: (s: FaceState) => void;
  setFaceImage: (img: Phaser.GameObjects.Image | null) => void;
}

const HEAD_R = 95;

export function buildVictim(scene: Phaser.Scene, x: number, y: number): VictimParts {
  const root = scene.add.container(x, y);

  const shadow = scene.add.ellipse(0, 340, 260, 60, COLORS.shadow, 0.25);

  const legLeft = scene.add.container(-42, 108);
  legLeft.add(roundedRect(scene, 62, 210, COLORS.pants, 26).setPosition(0, 102));
  legLeft.add(roundedRect(scene, 78, 42, COLORS.pantsShade, 18).setPosition(0, 192));
  const legRight = scene.add.container(42, 108);
  legRight.add(roundedRect(scene, 62, 210, COLORS.pants, 26).setPosition(0, 102));
  legRight.add(roundedRect(scene, 78, 42, COLORS.pantsShade, 18).setPosition(0, 192));

  // Torso
  const torso = scene.add.container(0, 0);
  const body = roundedRect(scene, 190, 230, COLORS.shirt, 46);
  const bodyShade = roundedRect(scene, 60, 230, COLORS.shirtShade, 30).setPosition(65, 0);
  const belt = roundedRect(scene, 190, 26, COLORS.pantsShade, 8).setPosition(0, 116);
  torso.add([body, bodyShade, belt]);

  // Arms
  const armLeft = scene.add.container(-104, -70);
  armLeft.add(roundedRect(scene, 40, 170, COLORS.shirt, 20).setPosition(0, 70));
  armLeft.add(scene.add.ellipse(0, 160, 44, 44, COLORS.skin));
  const armRight = scene.add.container(104, -70);
  armRight.add(roundedRect(scene, 40, 170, COLORS.shirt, 20).setPosition(0, 70));
  armRight.add(scene.add.ellipse(0, 160, 44, 44, COLORS.skin));

  // Head
  const head = scene.add.container(0, -210);
  const skull = scene.add.ellipse(0, 0, HEAD_R * 2, HEAD_R * 2 + 10, COLORS.skin);
  const ear1 = scene.add.ellipse(-HEAD_R, 6, 30, 44, COLORS.skinShade);
  const ear2 = scene.add.ellipse(HEAD_R, 6, 30, 44, COLORS.skinShade);
  const hair = scene.add.graphics();
  hair.fillStyle(COLORS.hair, 1);
  hair.beginPath();
  hair.arc(0, 0, HEAD_R + 1, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
  hair.closePath();
  hair.fillPath();
  head.add([ear1, ear2, skull, hair]);

  const bruiseLayer = scene.add.container(0, 0);
  head.add(bruiseLayer);

  const faces = buildFaces(scene);
  head.add(faces.container);
  let faceImage: Phaser.GameObjects.Image | null = null;

  root.add([shadow, legLeft, legRight, armLeft, armRight, torso, head]);

  return {
    root,
    shadow,
    legLeft,
    legRight,
    torso,
    armLeft,
    armRight,
    head,
    headRadius: HEAD_R,
    bruiseLayer,
    setFace: faces.setState,
    setFaceImage: (img) => {
      if (faceImage) faceImage.destroy();
      faceImage = img;
      if (img) {
        head.add(img);
        head.bringToTop(bruiseLayer);
        head.bringToTop(faces.container);
        faces.setState("idle");
        faces.hideFeaturesForPhoto(true);
      } else {
        faces.hideFeaturesForPhoto(false);
      }
    },
  };
}

interface Faces {
  container: Phaser.GameObjects.Container;
  setState: (s: FaceState) => void;
  hideFeaturesForPhoto: (hide: boolean) => void;
}

function buildFaces(scene: Phaser.Scene): Faces {
  const container = scene.add.container(0, 0);

  const idle = scene.add.container(0, 0);
  const eyeL = scene.add.ellipse(-34, -4, 32, 38, COLORS.eyeWhite);
  const eyeR = scene.add.ellipse(34, -4, 32, 38, COLORS.eyeWhite);
  const pupL = scene.add.ellipse(-32, 0, 14, 16, COLORS.pupil);
  const pupR = scene.add.ellipse(32, 0, 14, 16, COLORS.pupil);
  const browL = roundedRect(scene, 30, 7, COLORS.hair, 4).setPosition(-34, -26).setAngle(6);
  const browR = roundedRect(scene, 30, 7, COLORS.hair, 4).setPosition(34, -26).setAngle(-6);
  const nose = scene.add.ellipse(0, 22, 22, 28, COLORS.skinShade);
  const mouth = roundedRect(scene, 44, 12, COLORS.mouth, 6).setPosition(0, 52);
  idle.add([eyeL, eyeR, pupL, pupR, browL, browR, nose, mouth]);

  const ow = scene.add.container(0, 0).setVisible(false);
  ow.add(makeX(scene, -34, -6));
  ow.add(makeX(scene, 34, -6));
  ow.add(scene.add.ellipse(0, 48, 40, 46, COLORS.mouth));
  ow.add(scene.add.ellipse(0, 44, 22, 16, COLORS.eyeWhite));

  const dizzy = scene.add.container(0, 0).setVisible(false);
  dizzy.add(makeSpiral(scene, -34, -6));
  dizzy.add(makeSpiral(scene, 34, -6));
  const wavy = scene.add.graphics();
  wavy.lineStyle(6, COLORS.mouth, 1);
  wavy.beginPath();
  wavy.moveTo(-26, 46);
  for (let i = 0; i <= 4; i++) wavy.lineTo(-26 + i * 13, 46 + (i % 2 === 0 ? -8 : 8));
  wavy.strokePath();
  dizzy.add(wavy);

  container.add([idle, ow, dizzy]);

  const setState = (s: FaceState): void => {
    idle.setVisible(s === "idle");
    ow.setVisible(s === "ow");
    dizzy.setVisible(s === "dizzy");
  };

  const hideFeaturesForPhoto = (hide: boolean): void => {
    container.setAlpha(hide ? 0 : 1);
  };

  return { container, setState, hideFeaturesForPhoto };
}

function makeX(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  c.add(roundedRect(scene, 40, 8, COLORS.pupil, 4).setAngle(45));
  c.add(roundedRect(scene, 40, 8, COLORS.pupil, 4).setAngle(-45));
  return c;
}

function makeSpiral(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(4, COLORS.pupil, 1);
  g.beginPath();
  for (let a = 0; a < Math.PI * 5; a += 0.3) {
    const r = a * 2.2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (a === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.strokePath();
  return g;
}
