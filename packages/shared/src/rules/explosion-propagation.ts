/**
 * Chama em cruz a partir de uma celula, ate o alcance.
 *
 * Em cada braco: piso deixa passar; caixa e atingida e para a chama; parede
 * para sem ser atingida. Bomba no caminho e atingida e para a chama, quem
 * continua e a explosao dela (chain-reaction.ts).
 */
import { cellIndex } from "../config/arena.js";
import { CellKind } from "../domain/cell.js";
import { cellAt, type Grid } from "../domain/grid.js";

const ARMS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export interface Propagation {
  /** Celulas com chama; a primeira e a origem. */
  readonly cells: number[];
  /** Caixas atingidas, a destruir. */
  readonly crates: number[];
}

export function propagate(
  grid: Grid,
  origin: { x: number; y: number },
  range: number,
  hasBomb: (x: number, y: number) => boolean,
): Propagation {
  const cells = [cellIndex(origin.x, origin.y)];
  const crates: number[] = [];

  for (const [dx, dy] of ARMS) {
    for (let step = 1; step <= range; step += 1) {
      const x = origin.x + dx * step;
      const y = origin.y + dy * step;
      const kind = cellAt(grid, x, y);
      if (kind === CellKind.Wall) {
        break;
      }
      const index = cellIndex(x, y);
      cells.push(index);
      if (kind === CellKind.Crate) {
        crates.push(index);
        break;
      }
      if (hasBomb(x, y)) {
        break;
      }
    }
  }

  return { cells, crates };
}
