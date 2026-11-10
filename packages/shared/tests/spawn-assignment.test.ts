import { describe, expect, it } from "vitest";
import { SPAWN_POINTS } from "../src/config/arena.js";
import { ARENA_LAYOUTS } from "../src/config/arena-layouts.js";
import { assignSpawns } from "../src/rules/spawn-assignment.js";
import { generateMap } from "../src/rules/map-generation.js";
import { seedRng } from "../src/simulation/rng.js";
import { createMatchState } from "../src/simulation/step.js";

/** Passos ao redor da volta de spawns entre dois indices. */
function gap(a: number, b: number): number {
  const total = SPAWN_POINTS.length;
  const d = Math.abs(a - b) % total;
  return Math.min(d, total - d);
}

describe("spawn-assignment", () => {
  it.each([2, 3, 4, 5, 6, 7, 8])("com %i jogadores, ninguem repete spawn e ficam espalhados", (n) => {
    for (let seed = 0; seed < 40; seed += 1) {
      const { spawnIndices } = assignSpawns(n, seedRng(seed));
      expect(new Set(spawnIndices).size).toBe(n);
      const sorted = [...spawnIndices].sort((a, b) => a - b);
      const nearest = sorted.map((s) => Math.min(...sorted.filter((o) => o !== s).map((o) => gap(s, o))));
      // Vizinho mais proximo de cada um difere no maximo 1 posicao entre jogadores.
      expect(Math.max(...nearest) - Math.min(...nearest)).toBeLessThanOrEqual(1);
      expect(Math.min(...nearest)).toBe(Math.floor(SPAWN_POINTS.length / n));
    }
  });

  it("com 2 jogadores, nascem em lados opostos", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const [a, b] = assignSpawns(2, seedRng(seed)).spawnIndices as [number, number];
      expect(gap(a, b)).toBe(SPAWN_POINTS.length / 2);
    }
  });

  it("varia o spawn de um jogador entre rodadas", () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 30; seed += 1) {
      seen.add(assignSpawns(4, seedRng(seed)).spawnIndices[0] as number);
    }
    expect(seen.size).toBeGreaterThan(4);
  });

  it("partida coloca cada jogador no centro do spawn sorteado", () => {
    const state = createMatchState(11, ["a", "b", "c"]);
    const cells = state.players.map((p) => `${Math.floor(p.x)},${Math.floor(p.y)}`);
    const valid = new Set(SPAWN_POINTS.map((s) => `${s.x},${s.y}`));
    expect(new Set(cells).size).toBe(3);
    cells.forEach((c) => expect(valid.has(c)).toBe(true));
  });
});

describe("layout sorteado", () => {
  it("todos os layouts aparecem em poucas rodadas", () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 60; seed += 1) {
      seen.add(generateMap(seedRng(seed)).layoutIndex);
    }
    expect(seen.size).toBe(ARENA_LAYOUTS.length);
  });
});
