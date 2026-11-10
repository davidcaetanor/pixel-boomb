/**
 * Onde cada jogador nasce nesta rodada.
 *
 * SPAWN_POINTS esta em ordem ao redor da arena. Para n jogadores, escolhe n
 * pontos espalhados por igual nessa volta, a partir de um ponto sorteado, e
 * depois embaralha quem fica com qual. Ninguem decora o proprio spawn, e a
 * distancia ate o vizinho mais proximo fica parecida para todos.
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
