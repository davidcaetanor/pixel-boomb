import { describe, expect, it } from "vitest";
import { playingMatch } from "./helpers.js";
import { BALANCE, TICK_SECONDS } from "../src/config/balance.js";
import { SPAWN_SAFE_INDICES, cellIndex, cellX, cellY } from "../src/config/arena.js";
import { CellKind } from "../src/domain/cell.js";
import { cellAt, countCells, setCell } from "../src/domain/grid.js";
import type { MatchState } from "../src/domain/match-state.js";
import type { InputCommand, InputsByPlayer } from "../src/commands/input-command.js";
import { crateCandidates, createStaticGrid, generateMap } from "../src/rules/map-generation.js";
import { propagate } from "../src/rules/explosion-propagation.js";
import { step } from "../src/simulation/step.js";
import { seedRng } from "../src/simulation/rng.js";

const BOMB: InputCommand = { moveX: 0, moveY: 0, bomb: true };
const FUSE_TICKS = Math.ceil(BALANCE.time.bombFuse / TICK_SECONDS);

/** Partida sem caixas, jogadores no centro das celulas dadas. */
function arena(positions: Record<string, [number, number]>): MatchState {
  const ids = Object.keys(positions);
  const base = playingMatch(1, ids);
  return {
    ...base,
    grid: createStaticGrid(),
    players: base.players.map((p) => {
      const [x, y] = positions[p.id] as [number, number];
      return { ...p, x: x + 0.5, y: y + 0.5 };
    }),
  };
}

function run(
  state: MatchState,
  inputs: (tick: number) => InputsByPlayer,
  ticks: number,
): MatchState {
  let s = state;
  for (let t = 0; t < ticks; t += 1) {
    s = step(s, inputs(t), TICK_SECONDS);
  }
  return s;
}

const cells = (list: [number, number][]): Set<number> =>
  new Set(list.map(([x, y]) => cellIndex(x, y)));

describe("map-generation", () => {
  it("poe caixas na densidade do balance e deixa os spawns livres", () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const { grid, layoutIndex } = generateMap(seedRng(seed));
      const candidates = crateCandidates(createStaticGrid(layoutIndex)).length;
      const density = countCells(grid, CellKind.Crate) / candidates;
      expect(density).toBeGreaterThanOrEqual(BALANCE.mapGeneration.crateDensityMin - 0.01);
      expect(density).toBeLessThanOrEqual(BALANCE.mapGeneration.crateDensityMax + 0.01);
      for (const index of SPAWN_SAFE_INDICES) {
        expect(grid.cells[index]).toBe(CellKind.Floor);
      }
    }
  });

  it("mesma semente, mesmo mapa; semente diferente, mapa diferente", () => {
    const a = generateMap(seedRng(7)).grid.cells;
    expect(generateMap(seedRng(7)).grid.cells).toEqual(a);
    expect(generateMap(seedRng(8)).grid.cells).not.toEqual(a);
  });

  it("nunca troca parede fixa por caixa", () => {
    const { grid, layoutIndex } = generateMap(seedRng(5));
    const fixed = createStaticGrid(layoutIndex);
    fixed.cells.forEach((kind, i) => {
      if (kind === CellKind.Wall) {
        expect(grid.cells[i]).toBe(CellKind.Wall);
      }
    });
  });
});

describe("bomb-placement", () => {
  it("trava no centro da celula do jogador", () => {
    let s = arena({ a: [3, 1] });
    s = { ...s, players: s.players.map((p) => ({ ...p, x: 3.8 })) };
    s = step(s, { a: BOMB }, TICK_SECONDS);
    expect(s.bombs).toHaveLength(1);
    expect(s.bombs[0]).toMatchObject({ x: 3, y: 1 });
  });

  it("uma por celula", () => {
    let s = arena({ a: [3, 1] });
    s = { ...s, players: s.players.map((p) => ({ ...p, maxBombs: 3 })) };
    s = run(s, () => ({ a: BOMB }), 5);
    expect(s.bombs).toHaveLength(1);
  });

  it("respeita maxBombs", () => {
    let s = arena({ a: [3, 1] });
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = run(s, () => ({ a: { moveX: 1, moveY: 0 } }), 10);
    s = step(s, { a: BOMB }, TICK_SECONDS);
    expect(s.bombs).toHaveLength(1);
  });

  it("sai de cima da bomba, mas nao volta", () => {
    let s = arena({ a: [3, 1] });
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = run(s, () => ({ a: { moveX: 1, moveY: 0 } }), 15);
    expect(s.players[0]?.x).toBeGreaterThan(4.4);
    s = run(s, () => ({ a: { moveX: -1, moveY: 0 } }), 15);
    expect(s.players[0]?.x).toBeCloseTo(4.4, 6);
  });
});

describe("explosion-propagation", () => {
  it("para na borda e respeita o alcance", () => {
    const { cells: hit } = propagate(createStaticGrid(), { x: 1, y: 1 }, 2, () => false);
    expect(new Set(hit)).toEqual(cells([[1, 1], [2, 1], [3, 1], [1, 2], [1, 3]]));
    expect(hit[0]).toBe(cellIndex(1, 1));
  });

  it("so em cruz e nunca atravessa pilar", () => {
    // (3,2) livre; (4,2) e pilar, entao o braco direito na linha 2 nao existe.
    const { cells: hit } = propagate(createStaticGrid(), { x: 3, y: 2 }, 6, () => false);
    for (const index of hit) {
      expect(cellX(index) === 3 || cellY(index) === 2).toBe(true);
    }
    expect(hit).not.toContain(cellIndex(4, 2));
    expect(hit).not.toContain(cellIndex(5, 2));
  });

  it("caixa e atingida e para a chama", () => {
    const grid = createStaticGrid();
    setCell(grid, 5, 1, CellKind.Crate);
    const result = propagate(grid, { x: 3, y: 1 }, 6, () => false);
    expect(result.crates).toEqual([cellIndex(5, 1)]);
    expect(result.cells).toContain(cellIndex(5, 1));
    expect(result.cells).not.toContain(cellIndex(6, 1));
  });
});

describe("bomb-timer e step", () => {
  it("estoura no fim do pavio e devolve a bomba ao dono", () => {
    let s = arena({ a: [5, 5] });
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = run(s, () => ({}), FUSE_TICKS - 2);
    expect(s.bombs).toHaveLength(1);
    s = run(s, () => ({}), 2);
    expect(s.bombs).toHaveLength(0);
    expect(s.explosions).toHaveLength(1);
    expect(s.players[0]?.bombsPlaced).toBe(0);
  });

  it("destroi so a primeira caixa da linha", () => {
    let s = arena({ a: [3, 1] });
    setCell(s.grid, 5, 1, CellKind.Crate);
    setCell(s.grid, 6, 1, CellKind.Crate);
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = { ...s, bombs: s.bombs.map((b) => ({ ...b, range: 6 })) };
    s = run(s, () => ({ a: { moveX: -1, moveY: 0 } }), FUSE_TICKS);
    expect(cellAt(s.grid, 5, 1)).toBe(CellKind.Floor);
    expect(cellAt(s.grid, 6, 1)).toBe(CellKind.Crate);
  });

  it("nao muta a grade do estado anterior", () => {
    let s = arena({ a: [3, 1] });
    setCell(s.grid, 4, 1, CellKind.Crate);
    s = step(s, { a: BOMB }, TICK_SECONDS);
    const before = s;
    s = run(s, () => ({}), FUSE_TICKS);
    expect(cellAt(before.grid, 4, 1)).toBe(CellKind.Crate);
    expect(cellAt(s.grid, 4, 1)).toBe(CellKind.Floor);
  });

  it("chama some depois de flameOnScreen", () => {
    let s = arena({ a: [5, 5] });
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = run(s, () => ({}), FUSE_TICKS);
    expect(s.explosions).toHaveLength(1);
    s = run(s, () => ({}), Math.ceil(BALANCE.time.flameOnScreen / TICK_SECONDS) + 1);
    expect(s.explosions).toHaveLength(0);
  });
});

describe("chain-reaction", () => {
  it("bomba detona bomba em corrente de 3, no mesmo tick", () => {
    let s = arena({ a: [1, 11] });
    s = {
      ...s,
      bombs: [
        { id: 101, ownerId: "a", x: 3, y: 1, range: 2, fuseRemaining: TICK_SECONDS / 2 },
        { id: 102, ownerId: "a", x: 5, y: 1, range: 2, fuseRemaining: 99 },
        { id: 103, ownerId: "a", x: 7, y: 1, range: 2, fuseRemaining: 99 },
        { id: 104, ownerId: "a", x: 11, y: 1, range: 2, fuseRemaining: 99 },
      ],
    };
    s = step(s, {}, TICK_SECONDS);
    expect(s.bombs.map((b) => b.id)).toEqual([104]);
    expect(s.explosions).toHaveLength(3);
  });

  it("bomba tocada por chama acesa estoura na hora", () => {
    let s = arena({ a: [1, 11] });
    s = {
      ...s,
      explosions: [{ id: 50, ownerId: "x", cells: [cellIndex(9, 3)], remaining: 0.4 }],
      bombs: [{ id: 60, ownerId: "a", x: 9, y: 3, range: 1, fuseRemaining: 2 }],
    };
    s = step(s, {}, TICK_SECONDS);
    expect(s.bombs).toHaveLength(0);
  });
});

describe("damage", () => {
  it("quem entra numa chama acesa morre e para de andar", () => {
    let s = arena({ a: [3, 1] });
    s = { ...s, explosions: [{ id: 1, ownerId: "x", cells: [cellIndex(4, 1)], remaining: 0.5 }] };
    s = run(s, () => ({ a: { moveX: 1, moveY: 0 } }), 8);
    expect(s.players[0]?.alive).toBe(false);
    const x = s.players[0]?.x;
    s = run(s, () => ({ a: { moveX: 1, moveY: 0 } }), 5);
    expect(s.players[0]?.x).toBe(x);
  });

  it("morre na propria bomba se ficar parado", () => {
    let s = arena({ a: [5, 5] });
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = run(s, () => ({}), FUSE_TICKS);
    expect(s.players[0]?.alive).toBe(false);
  });

  it("escapa do proprio alcance andando reto", () => {
    let s = arena({ a: [1, 1] });
    s = step(s, { a: BOMB }, TICK_SECONDS);
    s = run(s, () => ({ a: { moveX: 1, moveY: 0 } }), FUSE_TICKS + 5);
    expect(s.players[0]?.alive).toBe(true);
  });
});
