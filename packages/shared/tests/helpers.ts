import type { MatchState } from "../src/domain/match-state.js";
import { MatchPhase } from "../src/domain/match-state.js";
import { createMatchState } from "../src/simulation/step.js";

/** Partida ja depois da contagem regressiva. */
export function playingMatch(seed: number, ids: readonly string[]): MatchState {
  return { ...createMatchState(seed, ids), phase: MatchPhase.Playing, elapsed: 0 };
}
