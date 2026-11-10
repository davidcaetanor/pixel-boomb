/**
 * Desenha a arena estatica. View passiva: le o layout de @pixelboom/shared e
 * pinta, sem decidir regra. Caixas entram com a geracao de mapa (E2).
 */
import Phaser from "phaser";
import {
  ARENA_COLS,
  ARENA_ROWS,
  SPAWN_POINTS,
  TILE_SIZE,
  isBorder,
  isPillar,
} from "@pixelboom/shared";
import { TEXTURA, caminhoDaTextura } from "../atlas/atlas-registry.js";

/** Cor de cada slot, usada para tingir o marcador de spawn. */
const CORES_JOGADOR = [
  0xe85d5d, 0x5da9e8, 0x6fcf63, 0xe8d15d,
  0xb46fe8, 0xe8945d, 0x5de8c9, 0xe85db4,
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "boot" });
  }

  preload(): void {
    for (const nome of Object.values(TEXTURA)) {
      this.load.image(nome, caminhoDaTextura(nome));
    }
  }

  create(): void {
    this.desenhaPiso();
    this.desenhaParedes();
    this.desenhaMarcadoresDeSpawn();
  }

  private desenhaPiso(): void {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        this.coloca(TEXTURA.piso, x, y);
      }
    }
  }

  private desenhaParedes(): void {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        if (isBorder(x, y)) {
          // Arvore grande no corpo da borda, pequena nos cantos, para a
          // silhueta do perimetro nao ficar repetitiva.
          const canto =
            (x === 0 || x === ARENA_COLS - 1) &&
            (y === 0 || y === ARENA_ROWS - 1);
          this.coloca(canto ? TEXTURA.arvorePequena : TEXTURA.arvore, x, y);
        } else if (isPillar(x, y)) {
          this.coloca(TEXTURA.pilar, x, y);
        }
      }
    }
  }

  private desenhaMarcadoresDeSpawn(): void {
    // Fixos ate existir a fase de contagem regressiva (E3).
    SPAWN_POINTS.forEach((spawn, slot) => {
      const marcador = this.coloca(TEXTURA.spawn, spawn.x, spawn.y);
      marcador.setTint(CORES_JOGADOR[slot] ?? 0xffffff);
    });
  }

  private coloca(
    textura: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Image {
    return this.add
      .image(x * TILE_SIZE, y * TILE_SIZE, textura)
      .setOrigin(0, 0);
  }
}
