/**
 * Pavio: desconta o tempo e aponta quais bombas estouram neste tick.
 */
import type { Bomb } from "../domain/bomb.js";

export function tickFuses(bombs: readonly Bomb[], dt: number): Bomb[] {
  return bombs.map((b) => ({ ...b, fuseRemaining: b.fuseRemaining - dt }));
}

export function expiredBombIds(bombs: readonly Bomb[]): number[] {
  return bombs.filter((b) => b.fuseRemaining <= 0).map((b) => b.id);
}
