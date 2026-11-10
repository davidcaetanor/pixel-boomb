/**
 * Power-ups no chao, uma imagem por celula. Some quando sai do estado.
 */
import type Phaser from "phaser";
import {
  CELL_CENTER,
  PowerUpKind,
  TILE_SIZE,
  cellIndex,
  type PowerUp,
} from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";

/** Mesmo nivel da bomba: abaixo do jogador e da chama. */
const POWERUP_DEPTH = 5;

const TEXTURA_POR_TIPO: Readonly<Record<PowerUpKind, string>> = {
  [PowerUpKind.Bomb]: TEXTURA.powerupBomba,
  [PowerUpKind.Range]: TEXTURA.powerupAlcance,
  [PowerUpKind.Speed]: TEXTURA.powerupVelocidade,
};

export class PowerUpView {
  private readonly sprites = new Map<number, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene) {}

  render(powerUps: readonly PowerUp[]): void {
    const presentes = new Set<number>();
    for (const p of powerUps) {
      const index = cellIndex(p.x, p.y);
      presentes.add(index);
      if (!this.sprites.has(index)) {
        const sprite = this.scene.add
          .image((p.x + CELL_CENTER) * TILE_SIZE, (p.y + CELL_CENTER) * TILE_SIZE, TEXTURA_POR_TIPO[p.kind])
          .setDepth(POWERUP_DEPTH);
        this.sprites.set(index, sprite);
      }
    }
    for (const [index, sprite] of this.sprites) {
      if (!presentes.has(index)) {
        sprite.destroy();
        this.sprites.delete(index);
      }
    }
  }
}
