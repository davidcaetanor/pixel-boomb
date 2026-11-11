/** Carrega as texturas e abre a partida. */
import Phaser from "phaser";
import { registraFonteHud } from "../hud/pixel-text.js";
import {
  DIGITOS,
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
    this.load.spritesheet(DIGITOS.chave, caminhoDaFolha(DIGITOS.chave), {
      frameWidth: DIGITOS.larguraFrame,
      frameHeight: DIGITOS.alturaFrame,
    });
    ELENCO.forEach((_, character) => {
      const chave = chaveDoPersonagem(character);
      this.load.spritesheet(chave, caminhoDaFolha(chave), {
        frameWidth: FOLHA_PERSONAGEM.larguraFrame,
        frameHeight: FOLHA_PERSONAGEM.alturaFrame,
      });
    });
  }

  /** `?local` abre a partida offline; o padrao e o lobby da sala online. */
  create(): void {
    registraFonteHud(this);
    const local = new URLSearchParams(window.location.search).has("local");
    this.scene.start(local ? "match" : "lobby");
  }
}
