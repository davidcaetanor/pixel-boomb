/**
 * Movimento continuo do jogador, em celulas por segundo (BALANCE.player).
 *
 * Dois comportamentos fazem a sensacao de "suave, sem degrau":
 *
 * 1. Virada antecipada: com duas direcoes seguradas, a mais recente tenta
 *    primeiro; se estiver bloqueada, segue na outra ate a virada abrir.
 * 2. Desvio de quina: se o jogador empurra contra um pilar mas o centro dele
 *    esta numa faixa cuja celula a frente esta livre, o passo que sobrou vira
 *    um ajuste lateral rumo ao centro dessa faixa. E isso que impede de
 *    "grudar" na quina ao entrar num corredor de 1 celula.
 */
import type { AxisIntent, InputCommand } from "../commands/input-command.js";
import { CELL_CENTER } from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import type { Grid } from "../domain/grid.js";
import { Facing, type Player } from "../domain/player.js";
import { isBlocked, moveAlongAxis, type Axis } from "./grid-collision.js";

export const PLAYER_HALF = BALANCE.player.hitboxSize / 2;

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface MoveResult extends Position {
  /** Direcao do eixo usado; ausente quando nada andou. */
  readonly facing?: Facing;
}

function facingOf(axis: Axis, dir: AxisIntent): Facing {
  if (axis === "x") {
    return dir > 0 ? Facing.East : Facing.West;
  }
  return dir > 0 ? Facing.South : Facing.North;
}

function moved(a: Position, b: Position): boolean {
  return a.x !== b.x || a.y !== b.y;
}

/** Normaliza intencao vinda de fora: qualquer coisa que nao seja -1/0/1 vira 0. */
export function sanitizeAxis(value: number): AxisIntent {
  if (value === 1 || value === -1) {
    return value;
  }
  return 0;
}

interface AxisMove {
  readonly pos: Position;
  /** Bateu na parede sem conseguir desviar pela quina. */
  readonly blocked: boolean;
}

function moveOnAxis(
  grid: Grid,
  pos: Position,
  axis: Axis,
  dir: AxisIntent,
  distance: number,
): AxisMove {
  if (dir === 0 || distance <= 0) {
    return { pos, blocked: dir !== 0 };
  }

  const box = { x: pos.x, y: pos.y, half: PLAYER_HALF };
  const along = axis === "x" ? pos.x : pos.y;
  const reached = moveAlongAxis(grid, box, axis, dir * distance);
  const moved = Math.abs(reached - along);
  const leftover = distance - moved;
  let next: Position = axis === "x" ? { x: reached, y: pos.y } : { x: pos.x, y: reached };

  if (leftover <= BALANCE.physics.collisionEpsilon) {
    return { pos: next, blocked: false };
  }

  // Desvio de quina: olha a celula a frente na faixa onde o centro esta.
  const across = axis === "x" ? next.y : next.x;
  const lane = Math.floor(across);
  const laneCenter = lane + CELL_CENTER;
  const offset = laneCenter - across;
  if (offset === 0) {
    return { pos: next, blocked: true };
  }

  const leadEdge = (axis === "x" ? next.x : next.y) + dir * PLAYER_HALF;
  // Bloqueado significa borda encostada numa linha inteira da grade.
  const edgeLine = Math.round(leadEdge);
  const ahead = dir > 0 ? edgeLine : edgeLine - 1;
  const aheadBlocked =
    axis === "x" ? isBlocked(grid, ahead, lane) : isBlocked(grid, lane, ahead);
  if (aheadBlocked) {
    return { pos: next, blocked: true };
  }

  const crossAxis: Axis = axis === "x" ? "y" : "x";
  const nudge = Math.sign(offset) * Math.min(leftover, Math.abs(offset));
  const crossBox = { x: next.x, y: next.y, half: PLAYER_HALF };
  const crossReached = moveAlongAxis(grid, crossBox, crossAxis, nudge);
  next = crossAxis === "x" ? { x: crossReached, y: next.y } : { x: next.x, y: crossReached };
  return { pos: next, blocked: false };
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
): MoveResult {
  const moveX = sanitizeAxis(input.moveX);
  const moveY = sanitizeAxis(input.moveY);
  const distance = player.speed * Math.max(dt, 0);

  const start: Position = { x: player.x, y: player.y };
  const intent = { x: moveX, y: moveY };
  const preferred: Axis = input.prefer === "y" ? "y" : "x";
  const first: Axis = intent[preferred] !== 0 ? preferred : preferred === "x" ? "y" : "x";
  const second: Axis = first === "x" ? "y" : "x";

  const tried = moveOnAxis(grid, start, first, intent[first], distance);
  if (!tried.blocked || intent[second] === 0) {
    return withFacing(start, tried.pos, first, intent[first]);
  }
  // Preferido travado: usa o outro a partir do ponto original, sem o
  // avanco parcial, para o jogador nao virar de lado por um tick.
  const fallback = moveOnAxis(grid, start, second, intent[second], distance);
  return withFacing(start, fallback.pos, second, intent[second]);
}

function withFacing(
  start: Position,
  end: Position,
  axis: Axis,
  dir: AxisIntent,
): MoveResult {
  if (dir === 0 || !moved(start, end)) {
    return end;
  }
  return { ...end, facing: facingOf(axis, dir) };
}
