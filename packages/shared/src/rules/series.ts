/**
 * Serie de rodadas: vence quem chega a roundsToWin. Esgotado maxRounds, vence
 * quem tiver mais vitorias; empate no topo encerra sem vencedor.
 */
import { BALANCE } from "../config/balance.js";
import type { MatchState } from "../domain/match-state.js";

export interface Series {
  /** Rodadas jogadas ate agora. */
  readonly roundsPlayed: number;
  readonly wins: Readonly<Record<string, number>>;
  readonly finished: boolean;
  readonly winnerId: string | null;
}

export const NEW_SERIES: Series = { roundsPlayed: 0, wins: {}, finished: false, winnerId: null };

function leader(wins: Readonly<Record<string, number>>): string | null {
  const ranked = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  if (first === undefined || (second !== undefined && second[1] === first[1])) {
    return null;
  }
  return first[0];
}

export function recordRound(series: Series, roundWinnerId: string | null): Series {
  const wins = { ...series.wins };
  if (roundWinnerId !== null) {
    wins[roundWinnerId] = (wins[roundWinnerId] ?? 0) + 1;
  }
  const roundsPlayed = series.roundsPlayed + 1;
  const { roundsToWin, maxRounds } = BALANCE.match;
  const champion = Object.entries(wins).find(([, n]) => n >= roundsToWin)?.[0] ?? null;
  const exhausted = roundsPlayed >= maxRounds;
  return {
    roundsPlayed,
    wins,
    finished: champion !== null || exhausted,
    winnerId: champion ?? (exhausted ? leader(wins) : null),
  };
}

/** Copia o placar da serie para os jogadores da rodada. */
export function applySeriesScore(state: MatchState, series: Series): MatchState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, roundsWon: series.wins[p.id] ?? 0 })),
  };
}
