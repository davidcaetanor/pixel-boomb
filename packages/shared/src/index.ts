/**
 * Superficie publica de @pixelboom/shared.
 *
 * Este pacote e a simulacao pura do jogo: nao conhece Phaser, Colyseus, DOM
 * nem Node. server e client importam daqui; nunca o contrario.
 */
export * from "./config/arena.js";
export * from "./config/balance.js";
export * from "./config/sudden-death-order.js";
export * from "./commands/input-command.js";
export * from "./domain/index.js";
export * from "./rules/bomb-placement.js";
export * from "./rules/bomb-timer.js";
export * from "./rules/chain-reaction.js";
export * from "./rules/damage.js";
export * from "./rules/explosion-propagation.js";
export * from "./rules/grid-collision.js";
export * from "./rules/map-generation.js";
export * from "./rules/pickup.js";
export * from "./rules/sudden-death.js";
export * from "./rules/victory.js";
export * from "./rules/movement.js";
export * from "./simulation/fixed-loop.js";
export * from "./simulation/rng.js";
export { createMatchState, createPlayer, step } from "./simulation/step.js";
