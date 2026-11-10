/** Chamas: centro na origem e bracos horizontais ou verticais nas demais celulas. */
import type Phaser from "phaser";
import { TILE_SIZE, cellX, cellY, type Explosion } from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";

/** Acima da bomba e do jogador. */
const FLAME_DEPTH = 15;

export class ExplosionView {
  private readonly grupos = new Map<number, Phaser.GameObjects.Image[]>();

  constructor(private readonly scene: Phaser.Scene) {}

  render(explosions: readonly Explosion[]): void {
    const vivas = new Set<number>();
    for (const explosion of explosions) {
      vivas.add(explosion.id);
      if (!this.grupos.has(explosion.id)) {
        this.grupos.set(explosion.id, this.desenha(explosion));
      }
    }
    for (const [id, imagens] of this.grupos) {
      if (!vivas.has(id)) {
        imagens.forEach((i) => i.destroy());
        this.grupos.delete(id);
      }
    }
  }

  private desenha(explosion: Explosion): Phaser.GameObjects.Image[] {
    const [origem, ...bracos] = explosion.cells;
    if (origem === undefined) {
      return [];
    }
    const oy = cellY(origem);
    const imagens = [this.coloca(TEXTURA.chamaCentro, origem)];
    for (const cell of bracos) {
      const textura = cellY(cell) === oy ? TEXTURA.chamaHorizontal : TEXTURA.chamaVertical;
      imagens.push(this.coloca(textura, cell));
    }
    return imagens;
  }

  private coloca(textura: string, cell: number): Phaser.GameObjects.Image {
    return this.scene.add
      .image(cellX(cell) * TILE_SIZE, cellY(cell) * TILE_SIZE, textura)
      .setOrigin(0, 0)
      .setDepth(FLAME_DEPTH);
  }
}
