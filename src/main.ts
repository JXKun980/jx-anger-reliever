import Phaser from "phaser";
import { COLORS, VIRTUAL } from "./constants";
import { RES } from "./res";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIRTUAL.width * RES,
    height: VIRTUAL.height * RES,
  },
  input: { activePointers: 3 },
  render: { antialias: true },
  scene: [GameScene, UIScene],
});
