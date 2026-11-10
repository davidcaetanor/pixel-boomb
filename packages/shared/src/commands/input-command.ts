/**
 * O que o jogador pediu neste tick. Intencao, nunca posicao: quem decide onde
 * o jogador termina e a simulacao.
 *
 * Cada eixo vale -1, 0 ou 1. Com os dois eixos ativos, `prefer` diz qual foi
 * apertado por ultimo: ele tenta primeiro, e o outro so vale se o preferido
 * estiver bloqueado. E isso que permite virar sem soltar a tecla anterior.
 */
export type AxisIntent = -1 | 0 | 1;
export type MoveAxis = "x" | "y";

export interface InputCommand {
  readonly moveX: AxisIntent;
  readonly moveY: AxisIntent;
  readonly prefer?: MoveAxis;
  /** Soltar bomba neste tick. O cliente manda so na borda do aperto. */
  readonly bomb?: boolean;
}

export const IDLE_INPUT: InputCommand = { moveX: 0, moveY: 0 };

/** Comandos do tick, por id de jogador. Jogador ausente fica parado. */
export type InputsByPlayer = Readonly<Record<string, InputCommand>>;
