import { describe, expect, it } from "vitest";
import { ARENA_COLS, ARENA_ROWS, cellX, cellY } from "../src/config/arena.js";
import { BALANCE } from "../src/config/balance.js";
import {
  SUDDEN_DEATH_RINGS,
  SUDDEN_DEATH_RING_COUNT,
} from "../src/config/sudden-death-order.js";

describe("aneis da morte subita", () => {
  it("tem 6 aneis no interior da arena 25x13", () => {
    expect(SUDDEN_DEATH_RING_COUNT).toBe(6);
    expect(SUDDEN_DEATH_RINGS).toHaveLength(6);
  });

  it("cobre todo o interior, sem repetir celula", () => {
    const all = SUDDEN_DEATH_RINGS.flat();
    const interior = (ARENA_COLS - 2) * (ARENA_ROWS - 2);
    expect(all).toHaveLength(interior);
    expect(new Set(all).size).toBe(interior);
  });

  it("fecha de fora para dentro", () => {
    SUDDEN_DEATH_RINGS.forEach((ring, index) => {
      for (const cell of ring) {
        const distance = Math.min(
          cellX(cell) - 1,
          ARENA_COLS - 2 - cellX(cell),
          cellY(cell) - 1,
          ARENA_ROWS - 2 - cellY(cell),
        );
        expect(distance).toBe(index);
      }
    });
    const first = SUDDEN_DEATH_RINGS[0];
    const last = SUDDEN_DEATH_RINGS[SUDDEN_DEATH_RING_COUNT - 1];
    expect(first?.length ?? 0).toBeGreaterThan(last?.length ?? 0);
  });

  it("fecha a arena dentro do teto de duracao da partida", () => {
    const { suddenDeathStart, suddenDeathRingInterval, matchMax } = BALANCE.time;
    const fim = suddenDeathStart + SUDDEN_DEATH_RING_COUNT * suddenDeathRingInterval;
    expect(fim).toBeLessThanOrEqual(matchMax);
  });
});
