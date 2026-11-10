/**
 * Distribuicao de spawns por rodada: n pontos igualmente espacados ao redor da
 * arena a partir de uma origem sorteada, embaralhados entre os jogadores.
 */
import { SPAWN_POINTS } from "../config/arena.js";
import { nextInt, shuffle, type RngState } from "../simulation/rng.js";

export interface SpawnAssignment {
  /** Indice em SPAWN_POINTS para cada jogador, na ordem recebida. */
  readonly spawnIndices: number[];
  readonly rng: RngState;
}

export function assignSpawns(playerCount: number, rng: RngState): SpawnAssignment {
  const total = SPAWN_POINTS.length;
  const count = Math.min(playerCount, total);
  const [offset, afterOffset] = nextInt(rng, total);
  const chosen = Array.from(
    { length: count },
    (_, i) => (offset + Math.floor((i * total) / count)) % total,
  );
  const [shuffled, afterShuffle] = shuffle(chosen, afterOffset);
  return { spawnIndices: shuffled, rng: afterShuffle };
}
