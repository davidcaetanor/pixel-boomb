/**
 * Carrega as texturas e passa para a partida. Nao desenha nem decide nada.
 */
import Phaser from "phaser";
import {
  FOLHA_JOGADOR,
  TEXTURA,
  caminhoDaFolha,
  caminhoDaTextura,
} from "../atlas/atlas-registry.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "boot" });
  }

  preload(): void {
    for (const nome of Object.values(TEXTURA)) {
      this.load.image(nome, caminhoDaTextura(nome));
    }
    this.load.spritesheet(FOLHA_JOGADOR.chave, caminhoDaFolha(FOLHA_JOGADOR.chave), {
      frameWidth: FOLHA_JOGADOR.larguraFrame,
      frameHeight: FOLHA_JOGADOR.alturaFrame,
    });
  }

  create(): void {
    this.scene.start("match");
  }
}
