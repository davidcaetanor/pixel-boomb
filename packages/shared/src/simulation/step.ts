/**
 * Simulacao pura: (estado, comandos, dt) => novo estado, sem mutar a entrada.
 *
 * Countdown so avanca o relogio. Finished ignora comandos, mas bombas e chamas
 * terminam de queimar. Nas demais fases o tick passa pelos estagios de STAGES,
 * nessa ordem.
 */
import { IDLE_INPUT, type InputsByPlayer } from "../commands/input-command.js";
import { BALANCE } from "../config/balance.js";
import { CELL_CENTER, SPAWN_POINTS, cellIndex, cellX, cellY } from "../config/arena.js";
import { CellKind } from "../domain/cell.js";
import { cloneGrid, setCell } from "../domain/grid.js";
import { MatchPhase, type MatchState } from "../domain/match-state.js";
import { Facing, type Player } from "../domain/player.js";
import { canPlaceBomb, createBomb, solidFor } from "../rules/bomb-placement.js";
import { expiredBombIds, tickFuses } from "../rules/bomb-timer.js";
import { detonate } from "../rules/chain-reaction.js";
import { applyDamage, flameCells } from "../rules/damage.js";
import { generateMap } from "../rules/map-generation.js";
import { burnPowerUps, collectPowerUps, rollDrops } from "../rules/pickup.js";
import { closeRings } from "../rules/sudden-death.js";
import { checkVictory } from "../rules/victory.js";
import { movePlayer } from "../rules/movement.js";
import { assignSpawns } from "../rules/spawn-assignment.js";
import { seedRng } from "./rng.js";

/** Jogador no centro do spawn indicado. O slot define cor e posicao no placar. */
export function createPlayer(id: string, slot: number, spawnIndex = slot): Player {
  const spawn = SPAWN_POINTS[spawnIndex % SPAWN_POINTS.length] ?? SPAWN_POINTS[0];
  if (spawn === undefined) {
    throw new Error("arena sem spawn");
  }
  const p = BALANCE.player;
  return {
    id,
    slot,
    x: spawn.x + CELL_CENTER,
    y: spawn.y + CELL_CENTER,
    facing: Facing.South,
    speed: p.speedInitial,
    maxBombs: p.bombsInitial,
    range: p.rangeInitial,
    bombsPlaced: 0,
    alive: true,
    roundsWon: 0,
  };
}

export function createMatchState(
  seed: number,
  playerIds: readonly string[],
): MatchState {
  const map = generateMap(seedRng(seed));
  const spawns = assignSpawns(playerIds.length, map.rng);
  return {
    tick: 0,
    elapsed: -BALANCE.time.countdown,
    phase: MatchPhase.Countdown,
    grid: map.grid,
    players: playerIds.map((id, slot) => createPlayer(id, slot, spawns.spawnIndices[slot] ?? slot)),
    bombs: [],
    explosions: [],
    powerUps: [],
    ringsClosed: 0,
    winnerId: null,
    nextEntityId: 1,
    rng: spawns.rng,
  };
}

interface TickContext {
  readonly inputs: InputsByPlayer;
  readonly dt: number;
}

type Stage = (state: MatchState, ctx: TickContext) => MatchState;

const movePlayers: Stage = (state, { inputs, dt }) => ({
  ...state,
  players: state.players.map((player) => {
    if (!player.alive) {
      return player;
    }
    const solid = solidFor(state.grid, state.bombs, player);
    const pos = movePlayer(solid, player, inputs[player.id] ?? IDLE_INPUT, dt);
    return { ...player, x: pos.x, y: pos.y, facing: pos.facing ?? player.facing };
  }),
});

const placeBombs: Stage = (state, { inputs }) => {
  const bombs = [...state.bombs];
  let nextEntityId = state.nextEntityId;
  const players = state.players.map((player) => {
    if (inputs[player.id]?.bomb !== true || !canPlaceBomb(state.grid, bombs, player)) {
      return player;
    }
    bombs.push(createBomb(nextEntityId, player));
    nextEntityId += 1;
    return { ...player, bombsPlaced: player.bombsPlaced + 1 };
  });
  return { ...state, players, bombs, nextEntityId };
};

const burnFuses: Stage = (state, { dt }) => ({ ...state, bombs: tickFuses(state.bombs, dt) });

/**
 * Estoura bombas de pavio vencido ou tocadas por chama acesa, em cadeia. As
 * chamas antigas envelhecem; as novas destroem caixas, queimam itens no chao e
 * sorteiam os itens das caixas destruidas.
 */
const detonateBombs: Stage = (state, { dt }) => {
  const lit = flameCells(state.explosions);
  const triggers = [
    ...expiredBombIds(state.bombs),
    ...state.bombs.filter((b) => lit.has(cellIndex(b.x, b.y))).map((b) => b.id),
  ];
  const chain = detonate(state.grid, state.bombs, triggers, state.nextEntityId);

  const players = state.players.map((player) => {
    const owned = chain.detonated.filter((b) => b.ownerId === player.id).length;
    return owned === 0 ? player : { ...player, bombsPlaced: player.bombsPlaced - owned };
  });

  let grid = state.grid;
  if (chain.cratesDestroyed.size > 0) {
    grid = cloneGrid(grid);
    for (const index of chain.cratesDestroyed) {
      setCell(grid, cellX(index), cellY(index), CellKind.Floor);
    }
  }

  const agedFlames = state.explosions
    .map((e) => ({ ...e, remaining: e.remaining - dt }))
    .filter((e) => e.remaining > 0);
  const drops = rollDrops(chain.cratesDestroyed, state.rng);
  const survivingItems = burnPowerUps(state.powerUps, flameCells(chain.explosions));

  return {
    ...state,
    grid,
    players,
    bombs: chain.remaining,
    explosions: [...agedFlames, ...chain.explosions],
    powerUps: [...survivingItems, ...drops.powerUps],
    nextEntityId: chain.nextEntityId,
    rng: drops.rng,
  };
};

const applyFlameDamage: Stage = (state) => ({
  ...state,
  players: applyDamage(state.players, flameCells(state.explosions)),
});

const collectItems: Stage = (state) => ({ ...state, ...collectPowerUps(state.players, state.powerUps) });

const closeSuddenDeathRings: Stage = (state) => {
  const closed = closeRings(state, state.elapsed);
  return {
    ...state,
    ...closed,
    phase: closed.ringsClosed > 0 ? MatchPhase.SuddenDeath : MatchPhase.Playing,
  };
};

const resolveVictory: Stage = (state) => {
  const outcome = checkVictory(state.players, state.elapsed);
  return {
    ...state,
    phase: outcome.finished ? MatchPhase.Finished : state.phase,
    winnerId: outcome.winnerId,
  };
};

const WORLD_STAGES: readonly Stage[] = [
  movePlayers,
  placeBombs,
  burnFuses,
  detonateBombs,
  applyFlameDamage,
  collectItems,
];

const ROUND_STAGES: readonly Stage[] = [closeSuddenDeathRings, resolveVictory];

export function step(state: MatchState, inputs: InputsByPlayer, dt: number): MatchState {
  const advanced = { ...state, tick: state.tick + 1, elapsed: state.elapsed + dt };

  if (state.phase === MatchPhase.Countdown) {
    return { ...advanced, phase: advanced.elapsed >= 0 ? MatchPhase.Playing : MatchPhase.Countdown };
  }

  const finished = state.phase === MatchPhase.Finished;
  const ctx: TickContext = { inputs: finished ? {} : inputs, dt };
  const stages = finished ? WORLD_STAGES : [...WORLD_STAGES, ...ROUND_STAGES];
  return stages.reduce((current, stage) => stage(current, ctx), advanced);
}
