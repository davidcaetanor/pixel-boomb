/**
 * Arena inicial: borda e pilares fixos, caixas sorteadas com RNG semeado.
 *
 * A densidade e sorteada entre os limites de BALANCE.mapGeneration e aplicada
 * sobre as celulas livres do interior, tirando spawns e suas clearances.
 */
import {
  ARENA_COLS,
  ARENA_ROWS,
  SPAWN_SAFE_INDICES,
  cellIndex,
  isStaticWall,
} from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import { CellKind } from "../domain/cell.js";
import { emptyGrid, setCell, type Grid } from "../domain/grid.js";
import { nextRange, shuffle, type RngState } from "../simulation/rng.js";

/** Grade so com borda e pilares. */
export function createStaticGrid(): Grid {
  const grid = emptyGrid();
  for (let y = 0; y < ARENA_ROWS; y += 1) {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      if (isStaticWall(x, y)) {
        setCell(grid, x, y, CellKind.Wall);
      }
    }
  }
  return grid;
}

/** Celulas que podem receber caixa, em ordem de varredura. */
export function crateCandidates(): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < ARENA_ROWS; y += 1) {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      if (!isStaticWall(x, y) && !SPAWN_SAFE_INDICES.has(cellIndex(x, y))) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

export interface GeneratedMap {
  readonly grid: Grid;
  readonly rng: RngState;
}

export function generateMap(rng: RngState): GeneratedMap {
  const { crateDensityMin, crateDensityMax } = BALANCE.mapGeneration;
  const [density, afterDensity] = nextRange(rng, crateDensityMin, crateDensityMax);
  const candidates = crateCandidates();
  const [shuffled, afterShuffle] = shuffle(candidates, afterDensity);
  const count = Math.round(density * candidates.length);

  const grid = createStaticGrid();
  for (const cell of shuffled.slice(0, count)) {
    setCell(grid, cell.x, cell.y, CellKind.Crate);
  }
  return { grid, rng: afterShuffle };
}
