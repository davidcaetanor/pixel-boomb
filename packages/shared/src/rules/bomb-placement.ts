/**
 * Posicionamento e bloqueio de bombas. A bomba ocupa a celula do centro do
 * jogador, uma por celula, ate maxBombs. Ela e solida para todo jogador que
 * nao estava sobre a celula no inicio do tick: quem esta em cima sai, mas nao
 * volta.
 */
import { BALANCE } from "../config/balance.js";
import { CellKind } from "../domain/cell.js";
import type { Bomb } from "../domain/bomb.js";
import { cellAt, type Grid } from "../domain/grid.js";
import type { Player } from "../domain/player.js";
import { cellsOverlapped, gridSolid, type Solid } from "./grid-collision.js";
import { PLAYER_HALF } from "./movement.js";

export function playerCell(player: Pick<Player, "x" | "y">): { x: number; y: number } {
  return { x: Math.floor(player.x), y: Math.floor(player.y) };
}

export function bombAt(bombs: readonly Bomb[], x: number, y: number): Bomb | undefined {
  return bombs.find((b) => b.x === x && b.y === y);
}

export function canPlaceBomb(grid: Grid, bombs: readonly Bomb[], player: Player): boolean {
  if (!player.alive || player.bombsPlaced >= player.maxBombs) {
    return false;
  }
  const cell = playerCell(player);
  return cellAt(grid, cell.x, cell.y) === CellKind.Floor && bombAt(bombs, cell.x, cell.y) === undefined;
}

export function createBomb(id: number, player: Player): Bomb {
  const cell = playerCell(player);
  return {
    id,
    ownerId: player.id,
    x: cell.x,
    y: cell.y,
    range: player.range,
    fuseRemaining: BALANCE.time.bombFuse,
  };
}

/** Solidez para um jogador: grade mais as bombas que ele nao pode atravessar. */
export function solidFor(
  grid: Grid,
  bombs: readonly Bomb[],
  player: Pick<Player, "x" | "y">,
): Solid {
  const base = gridSolid(grid);
  const standingOn = new Set(
    cellsOverlapped({ x: player.x, y: player.y, half: PLAYER_HALF }).map((c) => `${c.x},${c.y}`),
  );
  const blocking = new Set(
    bombs.filter((b) => !standingOn.has(`${b.x},${b.y}`)).map((b) => `${b.x},${b.y}`),
  );
  return (cx, cy) => base(cx, cy) || blocking.has(`${cx},${cy}`);
}
