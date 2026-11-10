/**
 * Colisao continua de uma caixa quadrada contra a grade.
 *
 * Posicoes em unidades de celula, com (x, y) no centro da caixa: a celula
 * (cx, cy) vai de cx a cx + 1. O movimento e resolvido um eixo por vez, o que
 * produz o deslizar ao longo da parede de graca.
 *
 * Quem e solido vem de um predicado `Solid`: a grade sozinha, ou a grade mais
 * as bombas que aquele jogador nao pode atravessar.
 *
 * Varre todas as colunas (ou linhas) entre a borda atual e a borda alvo, entao
 * nao ha tunelamento mesmo com passo maior que uma celula.
 */
import { BALANCE } from "../config/balance.js";
import { blocksMovement } from "../domain/cell.js";
import { cellAt, type Grid } from "../domain/grid.js";

const EPS = BALANCE.physics.collisionEpsilon;

export type Axis = "x" | "y";

/** A celula (cx, cy) bloqueia o movimento? */
export type Solid = (cx: number, cy: number) => boolean;

export interface Box {
  readonly x: number;
  readonly y: number;
  /** Metade do lado. */
  readonly half: number;
}

/** Celula bloqueia o movimento? Fora da arena conta como parede. */
export function isBlocked(grid: Grid, cx: number, cy: number): boolean {
  return blocksMovement(cellAt(grid, cx, cy));
}

/** Solidez so da grade: parede, caixa e fora da arena. */
export function gridSolid(grid: Grid): Solid {
  return (cx, cy) => isBlocked(grid, cx, cy);
}

/** Celulas que a caixa ocupa, em indices de coluna e linha. */
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

/** A caixa ocupa alguma celula solida? */
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
