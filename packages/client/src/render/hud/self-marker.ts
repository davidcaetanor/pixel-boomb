/**
 * Seta sobre o proprio jogador, na cor do slot. Grande e com "VOCE" no inicio
 * da rodada, discreta depois.
 */
import type Phaser from "phaser";
import { MatchPhase } from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";
import { corDoSlot } from "../palette.js";
import { textoHud } from "./pixel-text.js";

const MARKER_DEPTH = 50;
/** Distancia acima do centro do sprite, em pixels. */
const OFFSET_Y = 26;
const BOB_AMPLITUDE = 3;
const BOB_PERIOD_MS = 600;
const ARROW_HEIGHT = 7;
/** Escala inteira: fracionaria desenha pixels de larguras diferentes. */
const HIGHLIGHT_SCALE = 2;
/** Segundos de destaque depois que a rodada comeca. */
const HIGHLIGHT_SECONDS = 2;

export class SelfMarker {
  private readonly arrow: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.BitmapText;

  constructor(scene: Phaser.Scene, slot: number) {
    const color = corDoSlot(slot);
    this.arrow = scene.add.image(0, 0, TEXTURA.uiSeta).setOrigin(0.5, 0).setTint(color).setDepth(MARKER_DEPTH);
    this.label = textoHud(scene, 0, 0, "VOCE").setDepth(MARKER_DEPTH);
  }

  render(x: number, y: number, phase: string, elapsed: number, timeMs: number, visible: boolean): void {
    const highlight = phase === MatchPhase.Countdown || elapsed < HIGHLIGHT_SECONDS;
    const bob = Math.sin((timeMs / BOB_PERIOD_MS) * Math.PI * 2) * BOB_AMPLITUDE;
    const top = Math.round(y - OFFSET_Y - ARROW_HEIGHT / 2 + (highlight ? bob : 0));
    const cx = Math.round(x);
    this.arrow.setPosition(cx, top).setScale(highlight ? HIGHLIGHT_SCALE : 1).setVisible(visible);
    this.label
      .setPosition(cx - Math.round(this.label.width / 2), top - this.label.height - 1)
      .setVisible(visible && highlight);
  }
}
