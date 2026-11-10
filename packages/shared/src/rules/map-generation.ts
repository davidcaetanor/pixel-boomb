/**
 * Arena inicial: layout de pilares sorteado e caixas sorteadas, tudo com RNG
 * semeado.
 *
 * A densidade de caixas e sorteada entre os limites de BALANCE.mapGeneration
 * e aplicada sobre o piso do layout, tirando spawns e suas clearances.
 */
import { ARENA_LAYOUTS, isLayoutWall, type ArenaLayout } from "../config/arena-layouts.js";
import { ARENA_COLS, ARENA_ROWS, SPAWN_SAFE_INDICES, cellIndex } from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import { CellKind } from "../domain/cell.js";
import { cellAt, emptyGrid, setCell, type Grid } from "../domain/grid.js";
import { nextInt, nextRange, shuffle, type RngState } from "../simulation/rng.js";

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

/** Celulas que podem receber caixa, em ordem de varredura. */
export function crateCandidates(grid: Grid): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < ARENA_ROWS; y += 1) {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      if (cellAt(grid, x, y) === CellKind.Floor && !SPAWN_SAFE_INDICES.has(cellIndex(x, y))) {
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
