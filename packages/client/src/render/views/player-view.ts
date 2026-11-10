/**
 * View passiva do jogador. Interpola entre o tick anterior e o atual.
 */
import Phaser from "phaser";
import { TILE_SIZE, type Player } from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";

/** Acima do piso, pilares e marcadores de spawn. */
const PLAYER_DEPTH = 10;

export class PlayerView {
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.image(0, 0, TEXTURA.jogador).setDepth(PLAYER_DEPTH);
  }

  render(previous: Player, current: Player, alpha: number): void {
    const x = Phaser.Math.Linear(previous.x, current.x, alpha);
    const y = Phaser.Math.Linear(previous.y, current.y, alpha);
    this.sprite.setPosition(x * TILE_SIZE, y * TILE_SIZE);
    this.sprite.setVisible(current.alive);
  }
}
