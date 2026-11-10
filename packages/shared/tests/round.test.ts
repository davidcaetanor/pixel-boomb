import { describe, expect, it } from "vitest";
import { playingMatch } from "./helpers.js";
import { BALANCE, TICK_SECONDS } from "../src/config/balance.js";
import { cellIndex } from "../src/config/arena.js";
import { SUDDEN_DEATH_RINGS } from "../src/config/sudden-death-order.js";
import { CellKind } from "../src/domain/cell.js";
import { cellAt, setCell } from "../src/domain/grid.js";
import { MatchPhase, type MatchState } from "../src/domain/match-state.js";
import { PowerUpKind } from "../src/domain/powerup.js";
import type { InputsByPlayer } from "../src/commands/input-command.js";
import { createStaticGrid } from "../src/rules/map-generation.js";
import { applyPowerUp, rollDrops } from "../src/rules/pickup.js";
import { ringsDue } from "../src/rules/sudden-death.js";
import { checkVictory } from "../src/rules/victory.js";
import { seedRng } from "../src/simulation/rng.js";
import { createMatchState, createPlayer, step } from "../src/simulation/step.js";

function arena(positions: Record<string, [number, number]>): MatchState {
  const base = playingMatch(1, Object.keys(positions));
  return {
    ...base,
    grid: createStaticGrid(),
    players: base.players.map((p) => {
      const [x, y] = positions[p.id] as [number, number];
      return { ...p, x: x + 0.5, y: y + 0.5 };
    }),
  };
}

function run(state: MatchState, inputs: InputsByPlayer, ticks: number): MatchState {
  let s = state;
  for (let t = 0; t < ticks; t += 1) {
    s = step(s, inputs, TICK_SECONDS);
  }
  return s;
}

const ticksFor = (seconds: number): number => Math.ceil(seconds / TICK_SECONDS);

describe("pickup", () => {
  it("sorteia perto de 30% das caixas, com os tres tipos", () => {
    const crates = Array.from({ length: 3000 }, (_, i) => i);
    const { powerUps } = rollDrops(crates, seedRng(3));
    const rate = powerUps.length / crates.length;
    expect(rate).toBeGreaterThan(BALANCE.mapGeneration.powerUpChance - 0.03);
    expect(rate).toBeLessThan(BALANCE.mapGeneration.powerUpChance + 0.03);
    expect(new Set(powerUps.map((p) => p.kind)).size).toBe(3);
  });

  it("e deterministico e independe da ordem de entrada", () => {
    const a = rollDrops([30, 10, 20, 40, 50], seedRng(9));
    const b = rollDrops([50, 40, 30, 20, 10], seedRng(9));
    expect(a).toEqual(b);
  });

  it("aplica cada tipo e respeita os tetos", () => {
    let p = createPlayer("a", 0);
    for (let i = 0; i < 20; i += 1) {
      p = applyPowerUp(p, PowerUpKind.Bomb);
      p = applyPowerUp(p, PowerUpKind.Range);
      p = applyPowerUp(p, PowerUpKind.Speed);
    }
    expect(p.maxBombs).toBe(BALANCE.player.bombsMax);
    expect(p.range).toBe(BALANCE.player.rangeMax);
    expect(p.speed).toBe(BALANCE.player.speedMax);
  });

  it("jogador pisa e coleta", () => {
    let s = arena({ a: [3, 1], b: [23, 11] });
    s = { ...s, powerUps: [{ kind: PowerUpKind.Range, x: 4, y: 1 }] };
    s = run(s, { a: { moveX: 1, moveY: 0 } }, 10);
    expect(s.powerUps).toHaveLength(0);
    expect(s.players[0]?.range).toBe(BALANCE.player.rangeInitial + 1);
  });

  it("chama nova queima power-up no chao", () => {
    let s = arena({ a: [1, 11], b: [23, 11] });
    s = {
      ...s,
      powerUps: [{ kind: PowerUpKind.Speed, x: 6, y: 1 }],
      bombs: [{ id: 1, ownerId: "a", x: 5, y: 1, range: 2, fuseRemaining: TICK_SECONDS / 2 }],
    };
    s = step(s, {}, TICK_SECONDS);
    expect(s.powerUps).toHaveLength(0);
  });

  it("power-up que nasce da caixa sobrevive a chama que a destruiu", () => {
    // Procura uma semente em que a caixa solta item, para nao depender da sorte.
    for (let seed = 0; seed < 50; seed += 1) {
      let s = arena({ a: [1, 11], b: [23, 11] });
      setCell(s.grid, 7, 1, CellKind.Crate);
      s = {
        ...s,
        rng: seedRng(seed),
        bombs: [{ id: 1, ownerId: "a", x: 5, y: 1, range: 2, fuseRemaining: TICK_SECONDS / 2 }],
      };
      s = step(s, {}, TICK_SECONDS);
      if (s.powerUps.length > 0) {
        s = run(s, {}, ticksFor(BALANCE.time.flameOnScreen) + 2);
        expect(s.powerUps).toEqual([expect.objectContaining({ x: 7, y: 1 })]);
        return;
      }
    }
    throw new Error("nenhuma semente soltou item");
  });
});

describe("sudden-death", () => {
  it("nenhum anel antes de 90 s, um por intervalo depois, ate o ultimo", () => {
    const { suddenDeathStart: start, suddenDeathRingInterval: gap } = BALANCE.time;
    expect(ringsDue(start - 0.01)).toBe(0);
    expect(ringsDue(start)).toBe(1);
    expect(ringsDue(start + gap - 0.01)).toBe(1);
    expect(ringsDue(start + gap)).toBe(2);
    expect(ringsDue(10_000)).toBe(SUDDEN_DEATH_RINGS.length);
  });

  it("ultimo anel fecha antes do teto da partida", () => {
    const { suddenDeathStart, suddenDeathRingInterval, matchMax } = BALANCE.time;
    const last = suddenDeathStart + (SUDDEN_DEATH_RINGS.length - 1) * suddenDeathRingInterval;
    expect(last).toBeLessThanOrEqual(matchMax);
  });

  it("anel vira parede, mata quem esta nele e muda a fase", () => {
    let s = arena({ a: [1, 1], b: [11, 5] });
    s = { ...s, elapsed: BALANCE.time.suddenDeathStart - TICK_SECONDS / 2 };
    s = step(s, {}, TICK_SECONDS);
    expect(s.phase).toBe(MatchPhase.Finished);
    expect(s.players[0]?.alive).toBe(false);
    expect(s.players[1]?.alive).toBe(true);
    expect(s.winnerId).toBe("b");
    expect(cellAt(s.grid, 1, 1)).toBe(CellKind.Wall);
    expect(cellAt(s.grid, 11, 5)).toBe(CellKind.Floor);
  });

  it("entra em SuddenDeath quando ninguem morre no anel", () => {
    let s = arena({ a: [3, 3], b: [11, 5] });
    s = { ...s, elapsed: BALANCE.time.suddenDeathStart - TICK_SECONDS / 2 };
    s = step(s, {}, TICK_SECONDS);
    expect(s.phase).toBe(MatchPhase.SuddenDeath);
    expect(s.ringsClosed).toBe(1);
  });

  it("bomba esmagada pelo anel devolve a contagem ao dono", () => {
    let s = arena({ a: [3, 3], b: [11, 5] });
    s = {
      ...s,
      elapsed: BALANCE.time.suddenDeathStart - TICK_SECONDS / 2,
      players: s.players.map((p) => (p.id === "a" ? { ...p, bombsPlaced: 1 } : p)),
      bombs: [{ id: 9, ownerId: "a", x: 1, y: 1, range: 2, fuseRemaining: 2 }],
    };
    s = step(s, {}, TICK_SECONDS);
    expect(s.bombs).toHaveLength(0);
    expect(s.players[0]?.bombsPlaced).toBe(0);
  });
});

describe("victory", () => {
  const alive = (id: string, isAlive: boolean) => ({ ...createPlayer(id, 0), alive: isAlive });

  it("ultimo vivo vence", () => {
    expect(checkVictory([alive("a", true), alive("b", false)], 10)).toEqual({
      finished: true,
      winnerId: "a",
    });
  });

  it("todos mortos e empate", () => {
    expect(checkVictory([alive("a", false), alive("b", false)], 10)).toEqual({
      finished: true,
      winnerId: null,
    });
  });

  it("dois vivos seguem jogando ate o teto", () => {
    const both = [alive("a", true), alive("b", true)];
    expect(checkVictory(both, 10).finished).toBe(false);
    expect(checkVictory(both, BALANCE.time.matchMax)).toEqual({ finished: true, winnerId: null });
  });

  it("sozinho, so acaba quando morre", () => {
    expect(checkVictory([alive("a", true)], 10).finished).toBe(false);
    expect(checkVictory([alive("a", false)], 10).finished).toBe(true);
  });
});

describe("fases", () => {
  it("contagem de 3 s em que nada se mexe, depois Playing", () => {
    let s = createMatchState(1, ["a", "b"]);
    expect(s.phase).toBe(MatchPhase.Countdown);
    const x = s.players[0]?.x;
    s = run(s, { a: { moveX: 1, moveY: 0, bomb: true } }, ticksFor(BALANCE.time.countdown) - 1);
    expect(s.phase).toBe(MatchPhase.Countdown);
    expect(s.players[0]?.x).toBe(x);
    expect(s.bombs).toHaveLength(0);
    s = run(s, {}, 2);
    expect(s.phase).toBe(MatchPhase.Playing);
  });

  it("depois do fim ignora entrada, mas as chamas terminam", () => {
    let s = arena({ a: [3, 1], b: [9, 1] });
    s = {
      ...s,
      players: s.players.map((p) => (p.id === "b" ? { ...p, alive: false } : p)),
      explosions: [{ id: 1, ownerId: "x", cells: [cellIndex(9, 1)], remaining: 0.3 }],
    };
    s = step(s, {}, TICK_SECONDS);
    expect(s.phase).toBe(MatchPhase.Finished);
    const x = s.players[0]?.x;
    s = run(s, { a: { moveX: 1, moveY: 0 } }, ticksFor(0.5));
    expect(s.players[0]?.x).toBe(x);
    expect(s.explosions).toHaveLength(0);
  });

  it("rodada inteira sem ninguem jogar termina ate o teto", () => {
    let s = createMatchState(4, ["a", "b"]);
    const limit = ticksFor(BALANCE.time.countdown + BALANCE.time.matchMax) + 1;
    for (let t = 0; t < limit && s.phase !== MatchPhase.Finished; t += 1) {
      s = step(s, {}, TICK_SECONDS);
    }
    expect(s.phase).toBe(MatchPhase.Finished);
    expect(s.elapsed).toBeLessThanOrEqual(BALANCE.time.matchMax + TICK_SECONDS);
  });
});
