import { describe, expect, it } from "vitest";
import {
  ARENA_COLS,
  ARENA_ROWS,
  CELL_COUNT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  RENDER_ZOOM,
  SPAWN_POINTS,
  cellIndex,
  isBorder,
  isPillar,
  isStaticWall,
} from "../src/config/arena.js";

describe("dimensoes da arena", () => {
  it("e impar x impar, o que o padrao de pilares exige", () => {
    expect(ARENA_COLS % 2).toBe(1);
    expect(ARENA_ROWS % 2).toBe(1);
  });

  it("cabe a 2x numa janela 1080p", () => {
    expect(LOGICAL_WIDTH).toBe(800);
    expect(LOGICAL_HEIGHT).toBe(416);
    expect(LOGICAL_HEIGHT * RENDER_ZOOM).toBe(832);
    expect(LOGICAL_HEIGHT * RENDER_ZOOM).toBeLessThan(1080);
    expect(LOGICAL_WIDTH * RENDER_ZOOM).toBeLessThanOrEqual(1920);
  });

  it("tem 198 celulas livres, ~25 por jogador", () => {
    let free = 0;
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        if (!isStaticWall(x, y)) {
          free += 1;
        }
      }
    }
    expect(free).toBe(198);
    expect(Math.floor(free / 8)).toBe(24);
  });
});

describe("paredes estaticas", () => {
  it("fecha todo o perimetro", () => {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      expect(isBorder(x, 0)).toBe(true);
      expect(isBorder(x, ARENA_ROWS - 1)).toBe(true);
    }
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      expect(isBorder(0, y)).toBe(true);
      expect(isBorder(ARENA_COLS - 1, y)).toBe(true);
    }
  });

  it("poe pilar em toda posicao par do interior e nada mais", () => {
    expect(isPillar(2, 2)).toBe(true);
    expect(isPillar(22, 10)).toBe(true);
    expect(isPillar(3, 2)).toBe(false);
    expect(isPillar(2, 3)).toBe(false);
    expect(isPillar(0, 0)).toBe(false);
  });

  it("garante que toda celula livre tem pelo menos duas saidas", () => {
    // Nenhum corredor sem saida: a propriedade que o padrao impar garante.
    for (let y = 1; y < ARENA_ROWS - 1; y += 1) {
      for (let x = 1; x < ARENA_COLS - 1; x += 1) {
        if (isStaticWall(x, y)) {
          continue;
        }
        const exits = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ].filter(([nx, ny]) => !isStaticWall(nx as number, ny as number));
        expect(exits.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("pontos de spawn", () => {
  it("tem exatamente 8", () => {
    expect(SPAWN_POINTS).toHaveLength(8);
  });

  it("nao coloca ninguem dentro de parede", () => {
    for (const spawn of SPAWN_POINTS) {
      expect(isStaticWall(spawn.x, spawn.y)).toBe(false);
    }
  });

  it("da a cada spawn um L de 3 celulas livres", () => {
    for (const spawn of SPAWN_POINTS) {
      expect(spawn.clearance).toHaveLength(2);
      for (const cell of spawn.clearance) {
        expect(isStaticWall(cell.x, cell.y)).toBe(false);
        const distance =
          Math.abs(cell.x - spawn.x) + Math.abs(cell.y - spawn.y);
        expect(distance).toBe(1);
      }
    }
  });

  it("nao repete celula entre spawns", () => {
    const used = new Set<number>();
    for (const spawn of SPAWN_POINTS) {
      for (const cell of [spawn, ...spawn.clearance]) {
        const index = cellIndex(cell.x, cell.y);
        expect(used.has(index)).toBe(false);
        used.add(index);
      }
    }
    expect(used.size).toBe(24);
  });
});

describe("indexacao da grade", () => {
  it("e biunivoca", () => {
    const seen = new Set<number>();
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        seen.add(cellIndex(x, y));
      }
    }
    expect(seen.size).toBe(CELL_COUNT);
  });
});
