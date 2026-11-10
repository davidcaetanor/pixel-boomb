/**
 * Predicao do movimento de um jogador: aplica entradas sobre uma posicao com a
 * mesma regra do servidor. Bombas nao sao previstas; aparecem com o estado
 * confirmado.
 */
import type { InputCommand } from "../commands/input-command.js";
import { TICK_SECONDS } from "../config/balance.js";
import type { Bomb } from "../domain/bomb.js";
import type { Grid } from "../domain/grid.js";
import type { Player } from "../domain/player.js";
import { solidFor } from "../rules/bomb-placement.js";
import { movePlayer } from "../rules/movement.js";

export interface PredictionWorld {
  readonly grid: Grid;
  readonly bombs: readonly Bomb[];
}

export function predictStep(world: PredictionWorld, player: Player, input: InputCommand): Player {
  if (!player.alive) {
    return player;
  }
  const solid = solidFor(world.grid, world.bombs, player);
  const pos = movePlayer(solid, player, input, TICK_SECONDS);
  return { ...player, x: pos.x, y: pos.y, facing: pos.facing ?? player.facing };
}

/** Parte do estado confirmado e reaplica as entradas ainda nao processadas. */
export function replayInputs(
  world: PredictionWorld,
  confirmed: Player,
  pending: readonly InputCommand[],
): Player {
  return pending.reduce((player, input) => predictStep(world, player, input), confirmed);
}
