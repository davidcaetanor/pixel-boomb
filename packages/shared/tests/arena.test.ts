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
} from "../src/config/arena.js";
import { ARENA_LAYOUTS, isLayoutWall, type ArenaLayout } from "../src/config/arena-layouts.js";

const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function freeCells(layout: ArenaLayout): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < ARENA_ROWS; y += 1) {
    for (let x = 0; x < ARENA_COLS; x += 1) {
      if (!isLayoutWall(layout, x, y)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

/** Distancia de caminhada entre duas celulas, so pelo piso do layout. */
function walk(layout: ArenaLayout, from: { x: number; y: number }, to: { x: number; y: number }): number {
  const dist = new Map<number, number>([[cellIndex(from.x, from.y), 0]]);
  const queue = [from];
  while (queue.length > 0) {
    const cur = queue.shift() as { x: number; y: number };
    const d = dist.get(cellIndex(cur.x, cur.y)) ?? 0;
    if (cur.x === to.x && cur.y === to.y) {
      return d;
    }
    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!isLayoutWall(layout, nx, ny) && !dist.has(cellIndex(nx, ny))) {
        dist.set(cellIndex(nx, ny), d + 1);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return Infinity;
}

describe("dimensoes da arena", () => {
  it("e impar x impar", () => {
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
});

describe.each(ARENA_LAYOUTS.map((l) => [l.name, l] as const))("layout %s", (_name, layout) => {
  it("tem o tamanho da arena", () => {
    expect(layout.rows).toHaveLength(ARENA_ROWS);
    for (const row of layout.rows) {
      expect(row).toHaveLength(ARENA_COLS);
      expect(row).toMatch(/^[#.S]+$/);
    }
  });

  it("fecha todo o perimetro", () => {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        if (isBorder(x, y)) {
          expect(isLayoutWall(layout, x, y)).toBe(true);
        }
      }
    }
  });

  it("e simetrico nos dois eixos", () => {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        const wall = isLayoutWall(layout, x, y);
        expect(isLayoutWall(layout, ARENA_COLS - 1 - x, y)).toBe(wall);
        expect(isLayoutWall(layout, x, ARENA_ROWS - 1 - y)).toBe(wall);
      }
    }
  });

  it("marca os spawns exatamente onde SPAWN_POINTS diz", () => {
    const marked = new Set<number>();
    layout.rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === "S") {
          marked.add(cellIndex(x, y));
        }
      });
    });
    expect(marked).toEqual(new Set(SPAWN_POINTS.map((s) => cellIndex(s.x, s.y))));
  });

  it("deixa spawn e clearance livres", () => {
    for (const spawn of SPAWN_POINTS) {
      for (const cell of [spawn, ...spawn.clearance]) {
        expect(isLayoutWall(layout, cell.x, cell.y)).toBe(false);
      }
    }
  });

  it("e todo conectado e sem beco sem saida", () => {
    const free = freeCells(layout);
    const first = free[0] as { x: number; y: number };
    for (const cell of free) {
      expect(walk(layout, first, cell)).toBeLessThan(Infinity);
      const exits = DIRS.filter(([dx, dy]) => !isLayoutWall(layout, cell.x + dx, cell.y + dy));
      expect(exits.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("deixa cada spawn a 8 celulas de caminhada dos dois vizinhos", () => {
    SPAWN_POINTS.forEach((spawn, i) => {
      const next = SPAWN_POINTS[(i + 1) % SPAWN_POINTS.length] as (typeof SPAWN_POINTS)[number];
      expect(walk(layout, spawn, next)).toBe(8);
    });
  });
});

describe("pontos de spawn", () => {
  it("tem exatamente 8", () => {
    expect(SPAWN_POINTS).toHaveLength(8);
  });

  it("da a cada spawn duas vizinhas livres", () => {
    for (const spawn of SPAWN_POINTS) {
      expect(spawn.clearance).toHaveLength(2);
      for (const cell of spawn.clearance) {
        expect(Math.abs(cell.x - spawn.x) + Math.abs(cell.y - spawn.y)).toBe(1);
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
