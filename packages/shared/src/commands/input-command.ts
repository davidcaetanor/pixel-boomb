/**
 * O que o jogador pediu neste tick. Intencao, nunca posicao: quem decide onde
 * o jogador termina e a simulacao.
 *
 * Cada eixo vale -1, 0 ou 1. A fonte de entrada do cliente entrega uma direcao
 * por vez; a simulacao aceita os dois eixos e valida mesmo assim.
 */
export type AxisIntent = -1 | 0 | 1;

export interface InputCommand {
  readonly moveX: AxisIntent;
  readonly moveY: AxisIntent;
}

export const IDLE_INPUT: InputCommand = { moveX: 0, moveY: 0 };

/** Comandos do tick, por id de jogador. Jogador ausente fica parado. */
export type InputsByPlayer = Readonly<Record<string, InputCommand>>;
