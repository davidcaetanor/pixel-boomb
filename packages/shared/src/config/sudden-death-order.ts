/**
 * Aneis do interior na ordem em que viram parede na morte subita, de fora para
 * dentro. O ritmo da partida e controlado pelos tempos em balance.ts.
 */
import { ARENA_COLS, ARENA_ROWS, cellIndex } from "./arena.js";

/** Distancia da celula a borda do interior. 0 = anel mais externo. */
function ringOf(x: number, y: number): number {
  return Math.min(x - 1, ARENA_COLS - 2 - x, y - 1, ARENA_ROWS - 2 - y);
}

/** Quantos aneis o interior tem. Para 25 x 13: 6. */
export const SUDDEN_DEATH_RING_COUNT = ringOf(
  Math.floor(ARENA_COLS / 2),
  Math.floor(ARENA_ROWS / 2),
) + 1;

/**
 * Indices de celula de cada anel, do mais externo ao mais interno.
 * SUDDEN_DEATH_RINGS[0] e o primeiro a fechar.
 */
export const SUDDEN_DEATH_RINGS: readonly (readonly number[])[] = (() => {
  const rings: number[][] = Array.from(
    { length: SUDDEN_DEATH_RING_COUNT },
    () => [],
  );

  for (let y = 1; y <= ARENA_ROWS - 2; y += 1) {
    for (let x = 1; x <= ARENA_COLS - 2; x += 1) {
      const ring = rings[ringOf(x, y)];
      if (ring !== undefined) {
        ring.push(cellIndex(x, y));
      }
    }
  }

  return rings.map((ring) => Object.freeze(ring));
})();
