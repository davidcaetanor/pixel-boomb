/**
 * Detona um conjunto de bombas e todas as que forem alcancadas pela chama,
 * em cadeia, dentro do mesmo tick.
 *
 * Todas as chamas leem a grade de antes da detonacao: duas bombas que
 * atingem a mesma caixa param nela, e a caixa so some no fim.
 */
import { BALANCE } from "../config/balance.js";
import { cellIndex } from "../config/arena.js";
import type { Bomb } from "../domain/bomb.js";
import type { Explosion } from "../domain/explosion.js";
import type { Grid } from "../domain/grid.js";
import { propagate } from "./explosion-propagation.js";

export interface ChainResult {
  readonly explosions: Explosion[];
  /** Bombas que continuam no chao. */
  readonly remaining: Bomb[];
  /** Bombas que estouraram, para devolver a contagem ao dono. */
  readonly detonated: Bomb[];
  readonly cratesDestroyed: Set<number>;
  readonly nextEntityId: number;
}

export function detonate(
  grid: Grid,
  bombs: readonly Bomb[],
  triggerIds: readonly number[],
  nextEntityId: number,
): ChainResult {
  const byCell = new Map(bombs.map((b) => [cellIndex(b.x, b.y), b]));
  const done = new Set<number>();
  const queue = bombs.filter((b) => triggerIds.includes(b.id));
  const explosions: Explosion[] = [];
  const detonated: Bomb[] = [];
  const cratesDestroyed = new Set<number>();
  let nextId = nextEntityId;

  while (queue.length > 0) {
    const bomb = queue.shift() as Bomb;
    if (done.has(bomb.id)) {
      continue;
    }
    done.add(bomb.id);
    detonated.push(bomb);

    const result = propagate(grid, bomb, bomb.range, (x, y) => byCell.has(cellIndex(x, y)));
    for (const crate of result.crates) {
      cratesDestroyed.add(crate);
    }
    for (const cell of result.cells) {
      const hit = byCell.get(cell);
      if (hit !== undefined && !done.has(hit.id)) {
        queue.push(hit);
      }
    }

    explosions.push({
      id: nextId,
      ownerId: bomb.ownerId,
      cells: result.cells,
      remaining: BALANCE.time.flameOnScreen,
    });
    nextId += 1;
  }

  return {
    explosions,
    remaining: bombs.filter((b) => !done.has(b.id)),
    detonated,
    cratesDestroyed,
    nextEntityId: nextId,
  };
}
