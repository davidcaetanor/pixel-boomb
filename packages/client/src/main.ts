import Phaser from "phaser";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "@pixelboom/shared";
import { acompanhaEscala, zoomCss } from "./render/pixel-scale.js";
import { BootScene } from "./render/scenes/boot-scene.js";
import { LobbyScene } from "./render/scenes/lobby-scene.js";
import { MatchScene } from "./render/scenes/match-scene.js";
import { OnlineScene } from "./render/scenes/online-scene.js";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  zoom: zoomCss(),
  backgroundColor: "#14121c",
  pixelArt: true,
  roundPixels: true,
  scene: [BootScene, LobbyScene, MatchScene, OnlineScene],
});

acompanhaEscala((zoom) => game.scale.setZoom(zoom));
