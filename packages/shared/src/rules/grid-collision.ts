/**
 * Colisao continua de uma caixa quadrada contra a grade, um eixo por vez, o
 * que produz o deslize ao longo da parede. A varredura cobre todas as linhas
 * entre a posicao atual e a alvo, evitando tunelamento.
 */
import { BALANCE } from "../config/balance.js";
import { blocksMovement } from "../domain/cell.js";
import { cellAt, type Grid } from "../domain/grid.js";

const EPS = BALANCE.physics.collisionEpsilon;

export type Axis = "x" | "y";

/** Indica se a celula bloqueia o movimento. */
export type Solid = (cx: number, cy: number) => boolean;

export interface Box {
  readonly x: number;
  readonly y: number;
  /** Metade do lado. */
  readonly half: number;
}

/** Fora da arena conta como parede. */
export function isBlocked(grid: Grid, cx: number, cy: number): boolean {
  return blocksMovement(cellAt(grid, cx, cy));
}

/** Solidez considerando apenas a grade. */
export function gridSolid(grid: Grid): Solid {
  return (cx, cy) => isBlocked(grid, cx, cy);
}

export function cellsOverlapped(box: Box): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const x0 = Math.floor(box.x - box.half + EPS);
  const x1 = Math.floor(box.x + box.half - EPS);
  const y0 = Math.floor(box.y - box.half + EPS);
  const y1 = Math.floor(box.y + box.half - EPS);
  for (let cy = y0; cy <= y1; cy += 1) {
    for (let cx = x0; cx <= x1; cx += 1) {
      cells.push({ x: cx, y: cy });
    }
  }
  return cells;
}

export function overlapsBlocked(solid: Solid, box: Box): boolean {
  return cellsOverlapped(box).some((c) => solid(c.x, c.y));
}

/**
 * Move a caixa `delta` celulas ao longo de `axis` e devolve a nova coordenada
 * desse eixo, parando encostada na primeira celula bloqueada.
 */
export function moveAlongAxis(
  solid: Solid,
  box: Box,
  axis: Axis,
  delta: number,
): number {
  const along = axis === "x" ? box.x : box.y;
  const across = axis === "x" ? box.y : box.x;
  if (delta === 0) {
    return along;
  }

  const dir = delta > 0 ? 1 : -1;
  const lead = along + dir * box.half;
  const target = lead + delta;
  const lane0 = Math.floor(across - box.half + EPS);
  const lane1 = Math.floor(across + box.half - EPS);

  const blockedAt = (line: number): boolean => {
    for (let lane = lane0; lane <= lane1; lane += 1) {
      const blocked = axis === "x" ? solid(line, lane) : solid(lane, line);
      if (blocked) {
        return true;
      }
    }
    return false;
  };

  if (dir > 0) {
    const first = Math.floor(lead - EPS) + 1;
    const last = Math.floor(target - EPS);
    for (let line = first; line <= last; line += 1) {
      if (blockedAt(line)) {
        return line - box.half;
      }
    }
  } else {
    const first = Math.floor(lead + EPS) - 1;
    const last = Math.floor(target + EPS);
    for (let line = first; line >= last; line -= 1) {
      if (blockedAt(line)) {
        return line + 1 + box.half;
      }
    }
  }

  return along + delta;
}
