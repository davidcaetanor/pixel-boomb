/**
 * Bombas no chao, uma imagem por id. Some quando a bomba sai do estado.
 */
import type Phaser from "phaser";
import { CELL_CENTER, TILE_SIZE, type Bomb } from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";

/** Acima da arena, abaixo do jogador. */
const BOMB_DEPTH = 5;

export class BombView {
  private readonly sprites = new Map<number, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene) {}

  render(bombs: readonly Bomb[]): void {
    const vivos = new Set<number>();
    for (const bomb of bombs) {
      vivos.add(bomb.id);
      if (!this.sprites.has(bomb.id)) {
        const sprite = this.scene.add
          .image((bomb.x + CELL_CENTER) * TILE_SIZE, (bomb.y + CELL_CENTER) * TILE_SIZE, TEXTURA.bomba)
          .setDepth(BOMB_DEPTH);
        this.sprites.set(bomb.id, sprite);
      }
    }
    for (const [id, sprite] of this.sprites) {
      if (!vivos.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
      }
    }
  }
}
