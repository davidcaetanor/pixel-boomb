/**
 * Power-ups: nascem de caixas destruidas, somem na chama, sao coletados pelo
 * jogador que pisa na celula. Cada tipo sobe um atributo ate o teto.
 */
import { cellIndex, cellX, cellY } from "../config/arena.js";
import { BALANCE } from "../config/balance.js";
import type { Player } from "../domain/player.js";
import { POWER_UP_KINDS, PowerUpKind, type PowerUp } from "../domain/powerup.js";
import { nextChance, nextInt, type RngState } from "../simulation/rng.js";
import { playerCell } from "./bomb-placement.js";

export interface Drops {
  readonly powerUps: PowerUp[];
  readonly rng: RngState;
}

/**
 * Sorteia um power-up para cada caixa destruida, em ordem crescente de
 * indice para que o consumo do RNG seja o mesmo no cliente e no servidor.
 */
export function rollDrops(crates: Iterable<number>, rng: RngState): Drops {
  const ordered = [...crates].sort((a, b) => a - b);
  const powerUps: PowerUp[] = [];
  let state = rng;
  for (const index of ordered) {
    const [drops, afterChance] = nextChance(state, BALANCE.mapGeneration.powerUpChance);
    state = afterChance;
    if (!drops) {
      continue;
    }
    const [pick, afterKind] = nextInt(state, POWER_UP_KINDS.length);
    state = afterKind;
    const kind = POWER_UP_KINDS[pick] ?? PowerUpKind.Bomb;
    powerUps.push({ kind, x: cellX(index), y: cellY(index) });
  }
  return { powerUps, rng: state };
}

/** Remove os power-ups que estao em celula com chama. */
export function burnPowerUps(powerUps: readonly PowerUp[], flames: ReadonlySet<number>): PowerUp[] {
  return powerUps.filter((p) => !flames.has(cellIndex(p.x, p.y)));
}

export function applyPowerUp(player: Player, kind: PowerUpKind): Player {
  const p = BALANCE.player;
  switch (kind) {
    case PowerUpKind.Bomb:
      return { ...player, maxBombs: Math.min(player.maxBombs + p.bombsStep, p.bombsMax) };
    case PowerUpKind.Range:
      return { ...player, range: Math.min(player.range + p.rangeStep, p.rangeMax) };
    case PowerUpKind.Speed:
      return { ...player, speed: Math.min(player.speed + p.speedStep, p.speedMax) };
  }
}

export interface Collection {
  readonly players: Player[];
  readonly powerUps: PowerUp[];
}

/** Jogador vivo com o centro na celula do power-up leva o item. */
export function collectPowerUps(players: readonly Player[], powerUps: readonly PowerUp[]): Collection {
  let remaining = [...powerUps];
  const updated = players.map((player) => {
    if (!player.alive) {
      return player;
    }
    const cell = playerCell(player);
    const taken = remaining.filter((p) => p.x === cell.x && p.y === cell.y);
    if (taken.length === 0) {
      return player;
    }
    remaining = remaining.filter((p) => !taken.includes(p));
    return taken.reduce((acc, p) => applyPowerUp(acc, p.kind), player);
  });
  return { players: updated, powerUps: remaining };
}
