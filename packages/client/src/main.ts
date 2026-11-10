import Phaser from "phaser";
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  RENDER_ZOOM,
} from "@pixelboom/shared";
import { BootScene } from "./render/scenes/boot-scene.js";
import { MatchScene } from "./render/scenes/match-scene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  zoom: RENDER_ZOOM,
  backgroundColor: "#14121c",
  pixelArt: true,
  roundPixels: true,
  scene: [BootScene, MatchScene],
});
