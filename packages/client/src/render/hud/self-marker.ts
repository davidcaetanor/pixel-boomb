/**
 * Seta sobre o proprio jogador, na cor do slot. Grande e com "VOCE" no inicio
 * da rodada, discreta depois.
 */
import type Phaser from "phaser";
import { MatchPhase } from "@pixelboom/shared";
import { corDoSlot } from "../palette.js";

const MARKER_DEPTH = 50;
/** Distancia acima do centro do sprite, em pixels. */
const OFFSET_Y = 26;
const BOB_AMPLITUDE = 3;
const BOB_PERIOD_MS = 600;
const ARROW_HALF_WIDTH = 5;
const ARROW_HEIGHT = 6;
const HIGHLIGHT_SCALE = 1.6;
/** Segundos de destaque depois que a rodada comeca. */
const HIGHLIGHT_SECONDS = 2;

export class SelfMarker {
  private readonly arrow: Phaser.GameObjects.Triangle;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, slot: number) {
    const color = corDoSlot(slot);
    this.arrow = scene.add
      .triangle(0, 0, 0, 0, ARROW_HALF_WIDTH * 2, 0, ARROW_HALF_WIDTH, ARROW_HEIGHT, color)
      .setStrokeStyle(1, 0x14121c)
      .setDepth(MARKER_DEPTH);
    this.label = scene.add
      .text(0, 0, "VOCE", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#f4ecd8",
        stroke: "#14121c",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(MARKER_DEPTH);
  }

  render(x: number, y: number, phase: string, elapsed: number, timeMs: number, visible: boolean): void {
    const highlight = phase === MatchPhase.Countdown || elapsed < HIGHLIGHT_SECONDS;
    const bob = Math.sin((timeMs / BOB_PERIOD_MS) * Math.PI * 2) * BOB_AMPLITUDE;
    const top = y - OFFSET_Y + (highlight ? bob : 0);
    this.arrow.setPosition(x, top).setScale(highlight ? HIGHLIGHT_SCALE : 1).setVisible(visible);
    this.label.setPosition(x, top - ARROW_HEIGHT).setVisible(visible && highlight);
  }
}
