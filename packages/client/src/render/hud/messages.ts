/** Textos do HUD derivados do estado, sem acesso a render. */
import { BALANCE, MatchPhase, type MatchState, type Player } from "@pixelboom/shared";

export interface SeriesInfo {
  readonly round: number;
  readonly finished: boolean;
  readonly winnerId: string | null;
}

export function playerName(player: Pick<Player, "slot">): string {
  return `J${player.slot + 1}`;
}

function nameOf(state: MatchState, id: string): string {
  const player = state.players.find((p) => p.id === id);
  return player === undefined ? "?" : playerName(player);
}

export function roundLabel(series: SeriesInfo): string {
  return `RODADA ${series.round}/${BALANCE.match.maxRounds}`;
}

export function roundResult(state: MatchState, localId: string): string {
  if (state.winnerId === null) {
    return state.players.length > 1 ? "Empate" : "Fim de rodada";
  }
  return state.winnerId === localId ? "Voce venceu a rodada" : `${nameOf(state, state.winnerId)} venceu a rodada`;
}

export function seriesResult(state: MatchState, series: SeriesInfo, localId: string): string {
  if (series.winnerId === null) {
    return "Serie empatada";
  }
  return series.winnerId === localId ? "Voce venceu a serie!" : `${nameOf(state, series.winnerId)} venceu a serie`;
}

/** Aviso central da partida online; null quando nada deve aparecer. */
export function onlineBanner(state: MatchState, series: SeriesInfo, localId: string): string | null {
  if (state.phase === MatchPhase.Finished) {
    return series.finished ? seriesResult(state, series, localId) : roundResult(state, localId);
  }
  const self = state.players.find((p) => p.id === localId);
  if (self === undefined) {
    return "Assistindo\nvoce entra na proxima rodada";
  }
  return self.alive ? null : "Eliminado\nassistindo";
}
