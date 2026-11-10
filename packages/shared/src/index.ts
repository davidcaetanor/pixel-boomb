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
export * from "./rules/grid-collision.js";
export * from "./rules/movement.js";
export * from "./simulation/fixed-loop.js";
export * from "./simulation/rng.js";
export * from "./simulation/step.js";
