/**
 * Carrega as texturas e passa para a partida.
 */
import Phaser from "phaser";
import { TEXTURA, caminhoDaTextura } from "../atlas/atlas-registry.js";

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
    this.scene.start("match");
  }
}
