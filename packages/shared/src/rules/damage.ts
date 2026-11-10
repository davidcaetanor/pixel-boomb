/**
 * Chama mata. Vale a celula do centro do jogador, nao a caixa de colisao:
 * encostar de raspao numa chama vizinha nao mata.
 */
import { cellIndex } from "../config/arena.js";
import type { Explosion } from "../domain/explosion.js";
import type { Player } from "../domain/player.js";
import { playerCell } from "./bomb-placement.js";

export function flameCells(explosions: readonly Explosion[]): Set<number> {
  const cells = new Set<number>();
  for (const explosion of explosions) {
    for (const cell of explosion.cells) {
      cells.add(cell);
    }
  }
  return cells;
}

export function isInFlame(player: Pick<Player, "x" | "y">, flames: ReadonlySet<number>): boolean {
  const cell = playerCell(player);
  return flames.has(cellIndex(cell.x, cell.y));
}

export function applyDamage(players: readonly Player[], flames: ReadonlySet<number>): Player[] {
  return players.map((p) => (p.alive && isInFlame(p, flames) ? { ...p, alive: false } : p));
}
