/**
 * Movimento continuo do jogador, em celulas por segundo (BALANCE.player).
 *
 * Dois comportamentos fazem a sensacao de "suave, sem degrau":
 *
 * 1. Deslizar: cada eixo e resolvido separado, entao andar na diagonal contra
 *    uma parede continua andando no outro eixo.
 * 2. Desvio de quina: se o jogador empurra contra um pilar mas o centro dele
 *    esta numa faixa cuja celula a frente esta livre, o passo que sobrou vira
 *    um ajuste lateral rumo ao centro dessa faixa. E isso que impede de
 *    "grudar" na quina ao entrar num corredor de 1 celula.
 */
import type { AxisIntent, InputCommand } from "../commands/input-command.js";
import { CELL_CENTER } from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import type { Grid } from "../domain/grid.js";
import type { Player } from "../domain/player.js";
import { isBlocked, moveAlongAxis, type Axis } from "./grid-collision.js";

export const PLAYER_HALF = BALANCE.player.hitboxSize / 2;

export interface Position {
  readonly x: number;
  readonly y: number;
}

/** Normaliza intencao vinda de fora: qualquer coisa que nao seja -1/0/1 vira 0. */
export function sanitizeAxis(value: number): AxisIntent {
  if (value === 1 || value === -1) {
    return value;
  }
  return 0;
}

function moveOnAxis(
  grid: Grid,
  pos: Position,
  axis: Axis,
  dir: AxisIntent,
  distance: number,
): Position {
  if (dir === 0 || distance <= 0) {
    return pos;
  }

  const box = { x: pos.x, y: pos.y, half: PLAYER_HALF };
  const along = axis === "x" ? pos.x : pos.y;
  const reached = moveAlongAxis(grid, box, axis, dir * distance);
  const moved = Math.abs(reached - along);
  const leftover = distance - moved;
  let next: Position = axis === "x" ? { x: reached, y: pos.y } : { x: pos.x, y: reached };

  if (leftover <= BALANCE.physics.collisionEpsilon) {
    return next;
  }

  // Desvio de quina: olha a celula a frente na faixa onde o centro esta.
  const across = axis === "x" ? next.y : next.x;
  const lane = Math.floor(across);
  const laneCenter = lane + CELL_CENTER;
  const offset = laneCenter - across;
  if (offset === 0) {
    return next;
  }

  const leadEdge = (axis === "x" ? next.x : next.y) + dir * PLAYER_HALF;
  // Bloqueado significa borda encostada numa linha inteira da grade.
  const edgeLine = Math.round(leadEdge);
  const ahead = dir > 0 ? edgeLine : edgeLine - 1;
  const aheadBlocked =
    axis === "x" ? isBlocked(grid, ahead, lane) : isBlocked(grid, lane, ahead);
  if (aheadBlocked) {
    return next;
  }

  const crossAxis: Axis = axis === "x" ? "y" : "x";
  const nudge = Math.sign(offset) * Math.min(leftover, Math.abs(offset));
  const crossBox = { x: next.x, y: next.y, half: PLAYER_HALF };
  const crossReached = moveAlongAxis(grid, crossBox, crossAxis, nudge);
  next = crossAxis === "x" ? { x: crossReached, y: next.y } : { x: next.x, y: crossReached };
  return next;
}

/**
 * Nova posicao do jogador depois de `dt` segundos com a intencao dada.
 * Funcao pura: nao muta nada.
 */
export function movePlayer(
  grid: Grid,
  player: Pick<Player, "x" | "y" | "speed">,
  input: InputCommand,
  dt: number,
): Position {
  const moveX = sanitizeAxis(input.moveX);
  const moveY = sanitizeAxis(input.moveY);
  const distance = player.speed * Math.max(dt, 0);

  let pos: Position = { x: player.x, y: player.y };
  pos = moveOnAxis(grid, pos, "x", moveX, distance);
  pos = moveOnAxis(grid, pos, "y", moveY, distance);
  return pos;
}
