/**
 * Texto do HUD na fonte pixel do jogo (assets/source/ui/desenho/glifos.py).
 * Texto vetorial ampliado pelo zoom do canvas sai serrilhado; a fonte em
 * bitmap fica nitida em qualquer escala inteira.
 */
import Phaser from "phaser";
import { TEXTURA } from "../atlas/atlas-registry.js";

export const FONTE_HUD = "hud";
/** Ordem dos glifos na folha, igual a FONTE_CHARS do script de desenho. */
const FONTE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ:/.!?-*●○ 0123456789";
const QUADRO_LARGURA = 7;
const QUADRO_ALTURA = 9;
/** Os contornos de glifos vizinhos se sobrepoem em 1 px. */
const ESPACO_LETRA = -1;
const ESPACO_LINHA = 3;

/** Registra a fonte no cache; chamar uma vez depois do carregamento. */
export function registraFonteHud(scene: Phaser.Scene): void {
  if (scene.cache.bitmapFont.exists(FONTE_HUD)) {
    return;
  }
  const entrada = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: TEXTURA.uiFonte,
    width: QUADRO_LARGURA,
    height: QUADRO_ALTURA,
    chars: FONTE_CHARS,
    charsPerRow: FONTE_CHARS.length,
    "spacing.x": 0,
    "spacing.y": 0,
    "offset.x": 0,
    "offset.y": 0,
    lineSpacing: 0,
  });
  // Parse ja devolve a entrada pronta do cache ({ data, texture, frame }).
  scene.cache.bitmapFont.add(FONTE_HUD, entrada);
}

/** A fonte so tem maiusculas e nao tem acento. */
export function paraFonteHud(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

export function textoHud(scene: Phaser.Scene, x: number, y: number, texto: string, escala = 1): Phaser.GameObjects.BitmapText {
  return scene.add
    .bitmapText(x, y, FONTE_HUD, paraFonteHud(texto))
    .setLetterSpacing(ESPACO_LETRA)
    .setLineSpacing(ESPACO_LINHA)
    .setCenterAlign()
    .setScale(escala);
}
