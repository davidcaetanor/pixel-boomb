/**
 * Arena inicial: layout de pilares sorteado e caixas sorteadas, tudo com RNG
 * semeado.
 *
 * A densidade de caixas e sorteada entre os limites de BALANCE.mapGeneration
 * e aplicada sobre o piso do layout, tirando spawns e suas clearances.
 *
 * Cada spawn tambem reserva uma rota de fuga: o caminho mais curto ate uma
 * celula fora da cruz da primeira bomba solta no spawn. Essas celulas nunca
 * recebem caixa. Sem isso, a maioria dos mapas prendia alguem logo de cara.
 */
import { ARENA_LAYOUTS, isLayoutWall, type ArenaLayout } from "../config/arena-layouts.js";
import {
  ARENA_COLS,
  ARENA_ROWS,
  SPAWN_POINTS,
  SPAWN_SAFE_INDICES,
  cellIndex,
  cellX,
  cellY,
} from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import { CellKind } from "../domain/cell.js";
import { cellAt, emptyGrid, setCell, type Grid } from "../domain/grid.js";
import { nextInt, nextRange, shuffle, type RngState } from "../simulation/rng.js";
import { propagate } from "./explosion-propagation.js";

function layoutAt(index: number): ArenaLayout {
  const layout = ARENA_LAYOUTS[index] ?? ARENA_LAYOUTS[0];
  if (layout === undefined) {
    throw new Error("nenhum layout de arena");
  }
  return layout;
}

/** Grade so com as paredes do layout, sem caixas. Layout 0 e o classico. */
export function createStaticGrid(layoutIndex = 0): Grid {
  const layout = layoutAt(layoutIndex);
  const grid = emptyGrid();
  for (let y = 0; y < ARENA_ROWS; y += 1) {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      if (isLayoutWall(layout, x, y)) {
        setCell(grid, x, y, CellKind.Wall);
      }
    }
  }
  return grid;
}

/** Celulas que nunca recebem caixa: spawns, clearances e rotas de fuga. */
export function reservedCells(grid: Grid): Set<number> {
  const reserved = new Set(SPAWN_SAFE_INDICES);
  for (const spawn of SPAWN_POINTS) {
    for (const cell of escapeRoute(grid, spawn)) {
      reserved.add(cell);
    }
  }
  return reserved;
}

/** Celulas que podem receber caixa, em ordem de varredura. */
export function crateCandidates(grid: Grid): { x: number; y: number }[] {
  const reserved = reservedCells(grid);
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < ARENA_ROWS; y += 1) {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      if (cellAt(grid, x, y) === CellKind.Floor && !reserved.has(cellIndex(x, y))) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

export interface GeneratedMap {
  readonly grid: Grid;
  readonly layoutIndex: number;
  readonly rng: RngState;
}

export function generateMap(rng: RngState): GeneratedMap {
  const [layoutIndex, afterLayout] = nextInt(rng, ARENA_LAYOUTS.length);
  const { crateDensityMin, crateDensityMax } = BALANCE.mapGeneration;
  const [density, afterDensity] = nextRange(afterLayout, crateDensityMin, crateDensityMax);

  const grid = createStaticGrid(layoutIndex);
  const candidates = crateCandidates(grid);
  const [shuffled, afterShuffle] = shuffle(candidates, afterDensity);
  const count = Math.round(density * candidates.length);
  for (const cell of shuffled.slice(0, count)) {
    setCell(grid, cell.x, cell.y, CellKind.Crate);
  }
  return { grid, layoutIndex, rng: afterShuffle };
}

const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Celulas que a primeira bomba no spawn atinge. */
export function firstBombReach(grid: Grid, spawn: { x: number; y: number }): Set<number> {
  return new Set(propagate(grid, spawn, BALANCE.player.rangeInitial, () => false).cells);
}

/**
 * Caminho mais curto, so por piso, do spawn ate a celula mais proxima fora da
 * cruz da primeira bomba. Roda sobre a grade do layout, antes das caixas.
 * Devolve as celulas do caminho, incluindo o spawn e o destino.
 */
export function escapeRoute(grid: Grid, spawn: { x: number; y: number }): number[] {
  const reach = firstBombReach(grid, spawn);
  const start = cellIndex(spawn.x, spawn.y);
  const prev = new Map<number, number>([[start, -1]]);
  const queue = [start];

  while (queue.length > 0) {
    const index = queue.shift() as number;
    if (!reach.has(index)) {
      const path: number[] = [];
      for (let at = index; at >= 0; at = prev.get(at) ?? -1) {
        path.push(at);
      }
      return path;
    }
    for (const [dx, dy] of DIRS) {
      const x = cellX(index) + dx;
      const y = cellY(index) + dy;
      const n = cellIndex(x, y);
      if (cellAt(grid, x, y) === CellKind.Floor && !prev.has(n)) {
        prev.set(n, index);
        queue.push(n);
      }
    }
  }
  return [];
}
