/**
 * Desenha a grade: borda como arvore, demais paredes como pilar, caixas e o
 * marcador de spawn de cada jogador, visivel so na contagem. A cada quadro
 * remove caixas destruidas e desenha paredes novas da morte subita.
 */
import type Phaser from "phaser";
import {
  ARENA_COLS,
  ARENA_ROWS,
  CellKind,
  MatchPhase,
  TILE_SIZE,
  cellAt,
  cellIndex,
  isBorder,
  type Grid,
  type MatchPhase as Phase,
  type Player,
} from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";
import { corDoSlot } from "../palette.js";

export class ArenaView {
  private readonly caixas = new Map<number, Phaser.GameObjects.Image>();
  /** Celulas que ja tem parede desenhada. */
  private readonly paredes = new Set<number>();
  private readonly marcadores: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    grid: Grid,
    players: readonly Player[],
  ) {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        // Xadrez de dois tons: cada celula da grade se le sozinha.
        this.coloca((x + y) % 2 === 0 ? TEXTURA.pisoClaro : TEXTURA.pisoEscuro, x, y);
        if (isBorder(x, y)) {
          const canto =
            (x === 0 || x === ARENA_COLS - 1) && (y === 0 || y === ARENA_ROWS - 1);
          this.coloca(canto ? TEXTURA.arvorePequena : TEXTURA.arvore, x, y);
          this.paredes.add(cellIndex(x, y));
        }
      }
    }

    for (const player of players) {
      const marcador = this.coloca(TEXTURA.spawn, Math.floor(player.x), Math.floor(player.y));
      this.marcadores.push(marcador.setTint(corDoSlot(player.slot)));
    }

    this.sincronizaParedes(grid);
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        if (cellAt(grid, x, y) === CellKind.Crate) {
          this.caixas.set(cellIndex(x, y), this.coloca(TEXTURA.caixa, x, y));
        }
      }
    }
  }

  render(grid: Grid, phase: Phase): void {
    const contagem = phase === MatchPhase.Countdown;
    for (const marcador of this.marcadores) {
      marcador.setVisible(contagem);
    }

    for (const [index, imagem] of this.caixas) {
      if (grid.cells[index] !== CellKind.Crate) {
        imagem.destroy();
        this.caixas.delete(index);
      }
    }

    this.sincronizaParedes(grid);
  }

  private sincronizaParedes(grid: Grid): void {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        const index = cellIndex(x, y);
        if (!this.paredes.has(index) && cellAt(grid, x, y) === CellKind.Wall) {
          this.paredes.add(index);
          this.coloca(TEXTURA.pilar, x, y);
        }
      }
    }
  }

  private coloca(textura: string, x: number, y: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x * TILE_SIZE, y * TILE_SIZE, textura).setOrigin(0, 0);
  }
}
