import { describe, expect, it } from "vitest";
import { playingMatch } from "./helpers.js";
import { BALANCE, TICK_SECONDS } from "../src/config/balance.js";
import { ARENA_COLS, ARENA_ROWS } from "../src/config/arena.js";
import { gridSolid, moveAlongAxis, overlapsBlocked } from "../src/rules/grid-collision.js";
import { PLAYER_HALF, movePlayer } from "../src/rules/movement.js";
import { step } from "../src/simulation/step.js";
import { createStaticGrid } from "../src/rules/map-generation.js";
import type { InputCommand } from "../src/commands/input-command.js";

const grid = gridSolid(createStaticGrid());
const speed = BALANCE.player.speedInitial;

function walk(
  start: { x: number; y: number },
  input: InputCommand,
  ticks: number,
): { x: number; y: number } {
  let pos = start;
  for (let i = 0; i < ticks; i += 1) {
    pos = movePlayer(grid, { ...pos, speed }, input, TICK_SECONDS);
  }
  return pos;
}

describe("grid-collision", () => {
  it("para encostado na borda sem atravessar", () => {
    const x = moveAlongAxis(grid, { x: 1.5, y: 1.5, half: 0.4 }, "x", -5);
    expect(x).toBeCloseTo(1.4, 10);
  });

  it("nao tunela atraves de pilar com passo enorme", () => {
    // Linha 2 tem pilar em x = 2.
    const y = moveAlongAxis(grid, { x: 2.5, y: 1.5, half: 0.4 }, "y", 10);
    expect(y).toBeCloseTo(1.6, 10);
  });

  it("anda livre num corredor", () => {
    const x = moveAlongAxis(grid, { x: 1.5, y: 1.5, half: 0.4 }, "x", 3);
    expect(x).toBeCloseTo(4.5, 10);
  });

  it("detecta sobreposicao com parede", () => {
    expect(overlapsBlocked(grid, { x: 1.5, y: 1.5, half: 0.4 })).toBe(false);
    expect(overlapsBlocked(grid, { x: 1.1, y: 1.5, half: 0.4 })).toBe(true);
  });
});

describe("movement", () => {
  it("anda a 3,5 celulas/s vindo de balance.ts", () => {
    const end = walk({ x: 1.5, y: 1.5 }, { moveX: 1, moveY: 0 }, 30);
    expect(end.x - 1.5).toBeCloseTo(speed, 6);
    expect(end.y).toBe(1.5);
  });

  it("segue na direcao antiga enquanto a nova esta bloqueada", () => {
    // Indo para a direita na linha 1, aperta baixo (mais recente) sobre o pilar.
    const end = walk({ x: 2.5, y: 1.5 }, { moveX: 1, moveY: 1, prefer: "y" }, 5);
    expect(end.x).toBeGreaterThan(2.5);
    expect(end.y).toBe(1.5);
  });

  it("vira sozinho quando a passagem abre, sem soltar a tecla antiga", () => {
    // Segurando direita e baixo a partir do pilar (2,2): entra no corredor x = 3.
    const end = walk({ x: 2.5, y: 1.5 }, { moveX: 1, moveY: 1, prefer: "y" }, 30);
    expect(end.x).toBeGreaterThanOrEqual(3 + PLAYER_HALF - 1e-9);
    expect(end.x).toBeLessThanOrEqual(4 - PLAYER_HALF + 1e-9);
    expect(end.y).toBeGreaterThan(3);
  });

  it("usa a direcao preferida quando as duas estao livres", () => {
    const end = walk({ x: 3.5, y: 1.5 }, { moveX: 1, moveY: 1, prefer: "y" }, 3);
    expect(end.x).toBe(3.5);
    expect(end.y).toBeGreaterThan(1.5);
  });

  it("nao gruda na quina: desvia para dentro do corredor", () => {
    // Desalinhado 0,3 para a direita do corredor x = 1, descendo.
    // Sem desvio o pilar de (2,2) travaria o jogador.
    const end = walk({ x: 1.8, y: 1.5 }, { moveX: 0, moveY: 1 }, 30);
    // Ajusta so o necessario para caber no corredor e segue descendo.
    expect(end.x).toBeLessThanOrEqual(2 - PLAYER_HALF + 1e-9);
    expect(end.x).toBeGreaterThanOrEqual(1.5);
    expect(end.y).toBeGreaterThan(2.5);
  });

  it("nao desvia quando a frente e parede na propria faixa", () => {
    // Centro na coluna 2 (pilar abaixo): para, sem escorregar.
    const end = walk({ x: 2.5, y: 1.5 }, { moveX: 0, moveY: 1 }, 30);
    expect({ x: end.x, y: end.y }).toEqual({ x: 2.5, y: 1 + 1 - PLAYER_HALF });
  });

  it("ignora intencao fora de -1/0/1", () => {
    const bogus = { moveX: 7, moveY: 0 } as unknown as InputCommand;
    expect(walk({ x: 1.5, y: 1.5 }, bogus, 5)).toEqual({ x: 1.5, y: 1.5 });
  });

  it("nunca sai da arena nem entra em parede ao andar a esmo", () => {
    let pos = { x: 1.5, y: 1.5 };
    const dirs: InputCommand[] = [
      { moveX: 1, moveY: 0 },
      { moveX: 0, moveY: 1 },
      { moveX: -1, moveY: 0 },
      { moveX: 0, moveY: -1 },
      { moveX: 1, moveY: 1 },
    ];
    for (let i = 0; i < 3000; i += 1) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)] as InputCommand;
      pos = walk(pos, dir, 1 + Math.floor(Math.random() * 20));
      expect(overlapsBlocked(grid, { ...pos, half: PLAYER_HALF })).toBe(false);
      expect(pos.x).toBeGreaterThan(1);
      expect(pos.x).toBeLessThan(ARENA_COLS - 1);
      expect(pos.y).toBeGreaterThan(1);
      expect(pos.y).toBeLessThan(ARENA_ROWS - 1);
    }
  });
});

describe("facing ao virar segurando a tecla", () => {
  // Segurando direita, aperta baixo sem soltar: a direcao muda uma unica vez.
  it.each([1.5, 1.9, 2.3, 2.7, 3.1, 3.3, 3.45, 3.6, 3.7, 3.9, 4.2])(
    "nao pisca de lado partindo de x = %s",
    (startX) => {
      let s = { ...playingMatch(1, ["p"]), grid: createStaticGrid() };
      s = { ...s, players: s.players.map((p) => ({ ...p, x: startX, y: 1.5 })) };
      const seen: string[] = [];
      for (let t = 0; t < 40; t += 1) {
        const input: InputCommand =
          t < 3 ? { moveX: 1, moveY: 0 } : { moveX: 1, moveY: 1, prefer: "y" };
        s = step(s, { p: input }, TICK_SECONDS);
        const facing = s.players[0]?.facing ?? "";
        if (seen[seen.length - 1] !== facing) {
          seen.push(facing);
        }
      }
      expect(seen).toEqual(["east", "south"]);
    },
  );
});

describe("facing contra parede", () => {
  it("vira para a parede mesmo sem andar", () => {
    // Em (1.5, 1.5) a borda fica a oeste: empurrar para a esquerda nao anda.
    const result = movePlayer(grid, { x: 1.4, y: 1.5, speed }, { moveX: -1, moveY: 0 }, TICK_SECONDS);
    expect(result).toEqual({ x: 1.4, y: 1.5, facing: "west" });
  });

  it("sem intencao nao muda a direcao", () => {
    const result = movePlayer(grid, { x: 1.5, y: 1.5, speed }, { moveX: 0, moveY: 0 }, TICK_SECONDS);
    expect(result.facing).toBeUndefined();
  });
});

describe("step", () => {
  it("move so quem mandou comando e nao muta o estado anterior", () => {
    const base = playingMatch(42, ["a", "b"]);
    const s0 = {
      ...base,
      grid: createStaticGrid(),
      players: base.players.map((p, i) => ({ ...p, x: 1.5 + i * 4, y: 1.5 })),
    };
    const s1 = step(s0, { a: { moveX: 1, moveY: 0 } }, TICK_SECONDS);
    expect(s1.tick).toBe(1);
    expect(s1.players[0]?.x).toBeGreaterThan(s0.players[0]?.x ?? Infinity);
    expect(s1.players[1]).toEqual(s0.players[1]);
    expect(s0.tick).toBe(0);
    expect(s0.players[0]?.x).toBe(1.5);
  });

  it("e deterministico", () => {
    const run = () => {
      let s = playingMatch(7, ["a"]);
      for (let i = 0; i < 90; i += 1) {
        s = step(s, { a: { moveX: i % 3 === 0 ? 0 : 1, moveY: 1 } }, TICK_SECONDS);
      }
      return s.players;
    };
    expect(run()).toEqual(run());
  });
});
