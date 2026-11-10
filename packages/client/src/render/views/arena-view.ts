/**
 * Arena: piso, borda, pilares, marcadores de spawn e caixas.
 *
 * Le o Grid e pinta. As caixas sao sincronizadas a cada quadro: se a celula
 * deixou de ser caixa na simulacao, a imagem sai.
 */
import type Phaser from "phaser";
import {
  ARENA_COLS,
  ARENA_ROWS,
  CellKind,
  SPAWN_POINTS,
  TILE_SIZE,
  cellAt,
  cellIndex,
  isBorder,
  isPillar,
  type Grid,
} from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";

/** Cor de cada slot, usada para tingir o marcador de spawn. */
const CORES_JOGADOR = [
  0xe85d5d, 0x5da9e8, 0x6fcf63, 0xe8d15d,
  0xb46fe8, 0xe8945d, 0x5de8c9, 0xe85db4,
];

export class ArenaView {
  private readonly caixas = new Map<number, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene, grid: Grid) {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        this.coloca(TEXTURA.piso, x, y);
        if (isBorder(x, y)) {
          // Arvore pequena nos cantos para o perimetro nao ficar repetitivo.
          const canto =
            (x === 0 || x === ARENA_COLS - 1) && (y === 0 || y === ARENA_ROWS - 1);
          this.coloca(canto ? TEXTURA.arvorePequena : TEXTURA.arvore, x, y);
        } else if (isPillar(x, y)) {
          this.coloca(TEXTURA.pilar, x, y);
        }
      }
    }

    // Fixos ate existir a fase de contagem regressiva (E3).
    SPAWN_POINTS.forEach((spawn, slot) => {
      this.coloca(TEXTURA.spawn, spawn.x, spawn.y).setTint(CORES_JOGADOR[slot] ?? 0xffffff);
    });

    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        if (cellAt(grid, x, y) === CellKind.Crate) {
          this.caixas.set(cellIndex(x, y), this.coloca(TEXTURA.caixa, x, y));
        }
      }
    }
  }

  render(grid: Grid): void {
    for (const [index, imagem] of this.caixas) {
      if (grid.cells[index] !== CellKind.Crate) {
        imagem.destroy();
        this.caixas.delete(index);
      }
    }
  }

  private coloca(textura: string, x: number, y: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x * TILE_SIZE, y * TILE_SIZE, textura).setOrigin(0, 0);
  }
}
