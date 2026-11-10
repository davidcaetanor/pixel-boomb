/**
 * Placar na faixa inferior da arena: um quadro por jogador, com a cor do slot,
 * o nome e as vitorias na serie. Eliminados ficam esmaecidos.
 */
import type Phaser from "phaser";
import { ARENA_ROWS, BALANCE, LOGICAL_WIDTH, TILE_SIZE, type Player } from "@pixelboom/shared";
import { corDoSlot } from "../palette.js";
import { playerName } from "./messages.js";

const HUD_DEPTH = 100;
const SLOTS = BALANCE.net.maxClientsPerRoom;
const CELL_WIDTH = LOGICAL_WIDTH / SLOTS;
const CENTER_Y = (ARENA_ROWS - 1) * TILE_SIZE + TILE_SIZE / 2;
const SWATCH_SIZE = 8;
const ELIMINATED_ALPHA = 0.35;
const WIN_FILLED = "●";
const WIN_EMPTY = "○";

interface Entry {
  readonly swatch: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;
}

export class Scoreboard {
  private readonly entries: Entry[] = [];

  constructor(scene: Phaser.Scene) {
    for (let slot = 0; slot < SLOTS; slot += 1) {
      const left = slot * CELL_WIDTH + SWATCH_SIZE;
      const swatch = scene.add
        .rectangle(left, CENTER_Y, SWATCH_SIZE, SWATCH_SIZE, corDoSlot(slot))
        .setStrokeStyle(1, 0x14121c)
        .setDepth(HUD_DEPTH);
      const text = scene.add
        .text(left + SWATCH_SIZE, CENTER_Y, "", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f4ecd8",
          stroke: "#14121c",
          strokeThickness: 3,
        })
        .setOrigin(0, 0.5)
        .setDepth(HUD_DEPTH);
      this.entries.push({ swatch, text });
    }
  }

  render(players: readonly Player[], localId: string): void {
    const bySlot = new Map(players.map((p) => [p.slot, p]));
    this.entries.forEach((entry, slot) => {
      const player = bySlot.get(slot);
      const visible = player !== undefined;
      entry.swatch.setVisible(visible);
      entry.text.setVisible(visible);
      if (player === undefined) {
        return;
      }
      const wins = WIN_FILLED.repeat(player.roundsWon) + WIN_EMPTY.repeat(Math.max(0, BALANCE.match.roundsToWin - player.roundsWon));
      const name = player.id === localId ? `${playerName(player)}*` : playerName(player);
      entry.text.setText(`${name} ${wins}`);
      const alpha = player.alive ? 1 : ELIMINATED_ALPHA;
      entry.swatch.setAlpha(alpha);
      entry.text.setAlpha(alpha);
    });
  }
}
