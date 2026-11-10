import { describe, expect, it } from "vitest";
import { SPAWN_POINTS, cellIndex } from "../src/config/arena.js";
import { BALANCE } from "../src/config/balance.js";
import { CellKind } from "../src/domain/cell.js";
import { cellAt, type Grid } from "../src/domain/grid.js";
import { propagate } from "../src/rules/explosion-propagation.js";
import { generateMap } from "../src/rules/map-generation.js";
import { seedRng } from "../src/simulation/rng.js";

/** Passos de celula que o jogador inicial anda antes do pavio, com folga de 1. */
const BUDGET = Math.floor(BALANCE.player.speedInitial * BALANCE.time.bombFuse) - 1;

/** Menor numero de passos, so por piso, ate sair da cruz da bomba no spawn. */
function stepsToSafety(grid: Grid, spawn: { x: number; y: number }): number {
  const flame = new Set(propagate(grid, spawn, BALANCE.player.rangeInitial, () => false).cells);
  const dist = new Map([[cellIndex(spawn.x, spawn.y), 0]]);
  const queue = [spawn];
  while (queue.length > 0) {
    const cur = queue.shift() as { x: number; y: number };
    const d = dist.get(cellIndex(cur.x, cur.y)) ?? 0;
    if (!flame.has(cellIndex(cur.x, cur.y))) {
      return d;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = cur.x + dx;
      const y = cur.y + dy;
      if (cellAt(grid, x, y) === CellKind.Floor && !dist.has(cellIndex(x, y))) {
        dist.set(cellIndex(x, y), d + 1);
        queue.push({ x, y });
      }
    }
  }
  return Infinity;
}

describe("rota de fuga da primeira bomba", () => {
  it("todo spawn de todo mapa escapa da propria bomba a tempo", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const { grid } = generateMap(seedRng(seed));
      for (const spawn of SPAWN_POINTS) {
        expect(stepsToSafety(grid, spawn), `semente ${seed}, spawn ${spawn.x},${spawn.y}`)
          .toBeLessThanOrEqual(BUDGET);
      }
    }
  });

  it("abre pouco: a densidade de caixas continua perto do sorteio", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const { grid } = generateMap(seedRng(seed));
      const crates = grid.cells.filter((c) => c === CellKind.Crate).length;
      expect(crates).toBeGreaterThan(80);
    }
  });
});
