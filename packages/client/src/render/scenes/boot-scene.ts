/** Carrega as texturas e abre a partida. */
import Phaser from "phaser";
import {
  ELENCO,
  FOLHA_PERSONAGEM,
  TEXTURA,
  caminhoDaFolha,
  caminhoDaTextura,
  chaveDoPersonagem,
} from "../atlas/atlas-registry.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "boot" });
  }

  preload(): void {
    for (const nome of Object.values(TEXTURA)) {
      this.load.image(nome, caminhoDaTextura(nome));
    }
    ELENCO.forEach((_, slot) => {
      const chave = chaveDoPersonagem(slot);
      this.load.spritesheet(chave, caminhoDaFolha(chave), {
        frameWidth: FOLHA_PERSONAGEM.larguraFrame,
        frameHeight: FOLHA_PERSONAGEM.alturaFrame,
      });
    });
  }

  /** `?local` abre a partida offline; o padrao e o lobby da sala online. */
  create(): void {
    const local = new URLSearchParams(window.location.search).has("local");
    this.scene.start(local ? "match" : "lobby");
  }
}
