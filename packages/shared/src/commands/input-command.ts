/**
 * Intencao do jogador em um tick; a posicao resultante e decidida pela
 * simulacao. Com os dois eixos ativos, `prefer` indica o eixo tentado primeiro;
 * o outro so e usado se o preferido estiver bloqueado.
 */
export type AxisIntent = -1 | 0 | 1;
export type MoveAxis = "x" | "y";

export interface InputCommand {
  readonly moveX: AxisIntent;
  readonly moveY: AxisIntent;
  readonly prefer?: MoveAxis;
  /** Soltar bomba neste tick. */
  readonly bomb?: boolean;
}

export const IDLE_INPUT: InputCommand = { moveX: 0, moveY: 0 };

/** Comandos do tick por id de jogador; ausencia equivale a parado. */
export type InputsByPlayer = Readonly<Record<string, InputCommand>>;
