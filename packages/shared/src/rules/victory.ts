/**
 * Fim da rodada: o ultimo vivo vence e a morte de todos e empate. Sozinho, o
 * jogador joga ate morrer. Atingir matchMax encerra em empate.
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
