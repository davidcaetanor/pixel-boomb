/**
 * Fim da rodada: ultimo vivo vence; se todos morrem, empate.
 *
 * Com um jogador so (partida local de teste), a rodada acaba quando ele morre.
 * O teto de matchMax encerra em empate caso a espiral nao resolva.
 */
import { BALANCE } from "../config/balance.js";
import type { Player } from "../domain/player.js";

export interface Outcome {
  readonly finished: boolean;
  /** Id do vencedor, ou null em empate. */
  readonly winnerId: string | null;
}

const ONGOING: Outcome = { finished: false, winnerId: null };

export function checkVictory(players: readonly Player[], elapsed: number): Outcome {
  const alive = players.filter((p) => p.alive);
  const lastStanding = players.length > 1 ? 1 : 0;

  if (alive.length <= lastStanding) {
    const winner = alive.length === 1 ? alive[0] : undefined;
    return { finished: true, winnerId: winner?.id ?? null };
  }
  if (elapsed >= BALANCE.time.matchMax) {
    return { finished: true, winnerId: null };
  }
  return ONGOING;
}
