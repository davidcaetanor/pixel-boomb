/**
 * Movimento continuo do jogador.
 *
 * Virada antecipada: com dois eixos ativos, o preferido e tentado primeiro e o
 * outro so e usado se ele estiver bloqueado.
 *
 * Desvio de quina: ao bater numa parede com a celula a frente livre na faixa
 * do centro, o passo restante alinha o jogador ao centro dessa faixa.
 */
import type { AxisIntent, InputCommand } from "../commands/input-command.js";
import { CELL_CENTER } from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import { Facing, type Player } from "../domain/player.js";
import { moveAlongAxis, type Axis, type Solid } from "./grid-collision.js";

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

/** Valores fora de -1, 0 e 1 viram 0. */
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
  solid: Solid,
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
  const reached = moveAlongAxis(solid, box, axis, dir * distance);
  const moved = Math.abs(reached - along);
  const leftover = distance - moved;
  let next: Position = axis === "x" ? { x: reached, y: pos.y } : { x: pos.x, y: reached };

  if (leftover <= BALANCE.physics.collisionEpsilon) {
    return { pos: next, blocked: false };
  }

  const across = axis === "x" ? next.y : next.x;
  const lane = Math.floor(across);
  const laneCenter = lane + CELL_CENTER;
  const offset = laneCenter - across;
  if (offset === 0) {
    return { pos: next, blocked: true };
  }

  const leadEdge = (axis === "x" ? next.x : next.y) + dir * PLAYER_HALF;
  const edgeLine = Math.round(leadEdge);
  const ahead = dir > 0 ? edgeLine : edgeLine - 1;
  const aheadBlocked = axis === "x" ? solid(ahead, lane) : solid(lane, ahead);
  if (aheadBlocked) {
    return { pos: next, blocked: true };
  }

  const crossAxis: Axis = axis === "x" ? "y" : "x";
  const nudge = Math.sign(offset) * Math.min(leftover, Math.abs(offset));
  const crossBox = { x: next.x, y: next.y, half: PLAYER_HALF };
  const crossReached = moveAlongAxis(solid, crossBox, crossAxis, nudge);
  next = crossAxis === "x" ? { x: crossReached, y: next.y } : { x: next.x, y: crossReached };
  return { pos: next, blocked: false };
}

export function movePlayer(
  solid: Solid,
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

  const tried = moveOnAxis(solid, start, first, intent[first], distance);
  if (!tried.blocked || intent[second] === 0) {
    return facingTowardWall(withFacing(start, tried.pos, first, intent[first]), first, intent[first]);
  }
  // O avanco parcial do eixo bloqueado e descartado para a direcao nao oscilar.
  const fallback = moveOnAxis(solid, start, second, intent[second], distance);
  return facingTowardWall(withFacing(start, fallback.pos, second, intent[second]), first, intent[first]);
}

/** Empurrando parede sem andar, o jogador se vira para o eixo preferido. */
function facingTowardWall(result: MoveResult, axis: Axis, dir: AxisIntent): MoveResult {
  if (result.facing !== undefined || dir === 0) {
    return result;
  }
  return { ...result, facing: facingOf(axis, dir) };
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
