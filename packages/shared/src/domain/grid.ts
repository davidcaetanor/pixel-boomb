import { ARENA_COLS, CELL_COUNT, cellIndex, isInside } from "../config/arena.js";
import { CellKind } from "./cell.js";

/**
 * A grade da arena, achatada. Uint8Array e so um array de bytes: nao e API de
 * Node nem de DOM, entao cabe dentro da simulacao pura.
 */
export interface Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: Uint8Array;
}

export function cellAt(grid: Grid, x: number, y: number): CellKind {
  if (!isInside(x, y)) {
    return CellKind.Wall;
  }
  return (grid.cells[cellIndex(x, y)] ?? CellKind.Wall) as CellKind;
}

export function setCell(grid: Grid, x: number, y: number, kind: CellKind): void {
  if (isInside(x, y)) {
    grid.cells[cellIndex(x, y)] = kind;
  }
}

export function cloneGrid(grid: Grid): Grid {
  return { cols: grid.cols, rows: grid.rows, cells: new Uint8Array(grid.cells) };
}

export function countCells(grid: Grid, kind: CellKind): number {
  let total = 0;
  for (let i = 0; i < grid.cells.length; i += 1) {
    if (grid.cells[i] === kind) {
      total += 1;
    }
  }
  return total;
}

export function emptyGrid(): Grid {
  return {
    cols: ARENA_COLS,
    rows: Math.floor(CELL_COUNT / ARENA_COLS),
    cells: new Uint8Array(CELL_COUNT),
  };
}
