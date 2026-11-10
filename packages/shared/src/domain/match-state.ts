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

/** Estado completo de uma rodada. O tempo e acumulado a partir do dt de cada tick. */
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
  /** Vencedor da rodada quando phase = Finished; null em empate ou em andamento. */
  winnerId: string | null;
  /** Proximo id livre para bomba e explosao. */
  nextEntityId: number;
  /** Estado do RNG, parte do estado para manter a simulacao reproduzivel. */
  rng: RngState;
}
