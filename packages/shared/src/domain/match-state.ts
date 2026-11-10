import type { Bomb } from "./bomb.js";
import type { Explosion } from "./explosion.js";
import type { Grid } from "./grid.js";
import type { Player } from "./player.js";
import type { PowerUp } from "./powerup.js";
import type { RngState } from "../simulation/rng.js";

export const MatchPhase = {
  /** Contagem regressiva; marcadores de spawn visiveis. */
  Countdown: "countdown",
  /** Rodada em andamento. */
  Playing: "playing",
  /** Espiral fechando. */
  SuddenDeath: "suddenDeath",
  /** Rodada encerrada: ultimo vivo venceu, ou empate. */
  Finished: "finished",
} as const;

export type MatchPhase = (typeof MatchPhase)[keyof typeof MatchPhase];

/**
 * O estado completo de uma rodada. A simulacao e
 * (estado, comandos, dt) => novo estado, e este e o estado.
 *
 * Nao contem nada de rede, de render nem de relogio: o tempo decorrido e
 * acumulado aqui a partir do dt que entra.
 */
export interface MatchState {
  /** Numero do tick da simulacao, comecando em 0. */
  tick: number;
  /** Segundos desde o fim da contagem regressiva. Negativo durante a contagem. */
  elapsed: number;
  phase: MatchPhase;
  grid: Grid;
  players: Player[];
  bombs: Bomb[];
  explosions: Explosion[];
  powerUps: PowerUp[];
  /** Quantos aneis a morte subita ja fechou. */
  ringsClosed: number;
  /** Proximo id livre para bomba e explosao. */
  nextEntityId: number;
  /** Estado do RNG com semente. Faz parte do estado para o snapshot ser fiel. */
  rng: RngState;
}
