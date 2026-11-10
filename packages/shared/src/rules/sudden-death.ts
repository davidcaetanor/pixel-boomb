/**
 * Morte subita: a cada intervalo um anel vira parede, de fora para dentro,
 * eliminando jogadores, bombas e itens nas celulas fechadas.
 */
import { cellIndex, cellX, cellY } from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import { SUDDEN_DEATH_RINGS } from "../config/sudden-death-order.js";
import type { Bomb } from "../domain/bomb.js";
import { CellKind } from "../domain/cell.js";
import { cloneGrid, setCell, type Grid } from "../domain/grid.js";
import type { Player } from "../domain/player.js";
import type { PowerUp } from "../domain/powerup.js";
import { playerCell } from "./bomb-placement.js";

/** Aneis que devem estar fechados no instante `elapsed`. */
export function ringsDue(elapsed: number): number {
  const { suddenDeathStart, suddenDeathRingInterval } = BALANCE.time;
  if (elapsed < suddenDeathStart) {
    return 0;
  }
  const due = Math.floor((elapsed - suddenDeathStart) / suddenDeathRingInterval) + 1;
  return Math.min(due, SUDDEN_DEATH_RINGS.length);
}

export interface SuddenDeathInput {
  readonly grid: Grid;
  readonly players: readonly Player[];
  readonly bombs: readonly Bomb[];
  readonly powerUps: readonly PowerUp[];
  readonly ringsClosed: number;
}

export interface SuddenDeathResult {
  readonly grid: Grid;
  readonly players: Player[];
  readonly bombs: Bomb[];
  readonly powerUps: PowerUp[];
  readonly ringsClosed: number;
}

export function closeRings(input: SuddenDeathInput, elapsed: number): SuddenDeathResult {
  const target = ringsDue(elapsed);
  if (target <= input.ringsClosed) {
    return { ...input, players: [...input.players], bombs: [...input.bombs], powerUps: [...input.powerUps] };
  }

  const closing = new Set<number>();
  for (let ring = input.ringsClosed; ring < target; ring += 1) {
    for (const cell of SUDDEN_DEATH_RINGS[ring] ?? []) {
      closing.add(cell);
    }
  }

  const grid = cloneGrid(input.grid);
  for (const cell of closing) {
    setCell(grid, cellX(cell), cellY(cell), CellKind.Wall);
  }

  const crushed = input.bombs.filter((b) => closing.has(cellIndex(b.x, b.y)));
  const players = input.players.map((p) => {
    const cell = playerCell(p);
    const dies = p.alive && closing.has(cellIndex(cell.x, cell.y));
    const lost = crushed.filter((b) => b.ownerId === p.id).length;
    if (!dies && lost === 0) {
      return p;
    }
    return { ...p, alive: p.alive && !dies, bombsPlaced: p.bombsPlaced - lost };
  });

  return {
    grid,
    players,
    bombs: input.bombs.filter((b) => !crushed.includes(b)),
    powerUps: input.powerUps.filter((p) => !closing.has(cellIndex(p.x, p.y))),
    ringsClosed: target,
  };
}
