/**
 * Placar na faixa inferior da arena: um quadro por jogador, com a cor do slot,
 * o nome e uma estrela por vitoria necessaria na serie (dourada quando ganha).
 * Eliminados ficam esmaecidos. Posicoes em pixels inteiros.
 */
import type Phaser from "phaser";
import { ARENA_ROWS, BALANCE, LOGICAL_WIDTH, TILE_SIZE, type Player } from "@pixelboom/shared";
import { TEXTURA } from "../atlas/atlas-registry.js";
import { corDoSlot } from "../palette.js";
import { textoHud } from "./pixel-text.js";
import { playerName } from "./messages.js";

const HUD_DEPTH = 100;
const SLOTS = BALANCE.net.maxClientsPerRoom;
const CELL_WIDTH = LOGICAL_WIDTH / SLOTS;
const CENTER_Y = (ARENA_ROWS - 1) * TILE_SIZE + TILE_SIZE / 2;
/** Largura do badge do slot, que tambem afasta o texto dele. */
const SWATCH_SIZE = 12;
const ELIMINATED_ALPHA = 0.35;
/** Estrela 9x9, alinhada pelo topo com o texto de 9 px. */
const ESTRELA_PASSO = 10;
const ESTRELA_RECUO = 2;
/** Topo do texto: a linha de 9 px centrada na faixa do placar. */
const TEXTO_TOPO = CENTER_Y - 4;
/** Tint neutro: mantem o creme da fonte. */
const COR_NOME = 0xffffff;

interface Entry {
  readonly swatch: Phaser.GameObjects.Image;
  readonly text: Phaser.GameObjects.BitmapText;
  readonly estrelas: Phaser.GameObjects.Image[];
}

export class Scoreboard {
  private readonly entries: Entry[] = [];

  constructor(scene: Phaser.Scene) {
    for (let slot = 0; slot < SLOTS; slot += 1) {
      const left = slot * CELL_WIDTH + SWATCH_SIZE;
      const swatch = scene.add.image(left, CENTER_Y, TEXTURA.uiBadge).setTint(corDoSlot(slot)).setDepth(HUD_DEPTH);
      const text = textoHud(scene, left + SWATCH_SIZE, TEXTO_TOPO, "").setDepth(HUD_DEPTH);
      const estrelas = Array.from({ length: BALANCE.match.roundsToWin }, () =>
        scene.add.image(0, TEXTO_TOPO, TEXTURA.uiVitoriaVazia).setOrigin(0, 0).setDepth(HUD_DEPTH),
      );
      this.entries.push({ swatch, text, estrelas });
    }
  }

  render(players: readonly Player[], localId: string): void {
    const bySlot = new Map(players.map((p) => [p.slot, p]));
    this.entries.forEach((entry, slot) => {
      const player = bySlot.get(slot);
      const visible = player !== undefined;
      entry.swatch.setVisible(visible);
      entry.text.setVisible(visible);
      for (const estrela of entry.estrelas) {
        estrela.setVisible(visible);
      }
      if (player === undefined) {
        return;
      }
      // O proprio nome sai na cor do slot; asterisco ao lado das estrelas confundia.
      entry.text.setText(playerName(player)).setTint(player.id === localId ? corDoSlot(slot) : COR_NOME);
      const alpha = player.alive ? 1 : ELIMINATED_ALPHA;
      entry.swatch.setAlpha(alpha);
      entry.text.setAlpha(alpha);
      const inicio = Math.round(entry.text.x + entry.text.width) + ESTRELA_RECUO;
      entry.estrelas.forEach((estrela, i) => {
        estrela
          .setTexture(i < player.roundsWon ? TEXTURA.uiVitoria : TEXTURA.uiVitoriaVazia)
          .setX(inicio + i * ESTRELA_PASSO)
          .setAlpha(alpha);
      });
    });
  }
}
