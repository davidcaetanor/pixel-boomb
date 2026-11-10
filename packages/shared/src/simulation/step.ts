/**
 * A funcao pura da simulacao: (estado, comandos, dt) => novo estado.
 *
 * Fases: Countdown (nada se mexe, relogio negativo ate 0), Playing,
 * SuddenDeath (a partir de suddenDeathStart) e Finished (entrada ignorada,
 * bombas e chamas terminam de queimar).
 *
 * Ordem do tick:
 * 1. movimento (bombas bloqueiam, exceto para quem ja estava em cima)
 * 2. soltar bomba
 * 3. pavio
 * 4. detonacao em cadeia: pavio vencido ou bomba tocada por chama acesa
 * 5. chamas antigas envelhecem, as novas entram
 * 6. dano: quem esta em celula com chama morre
 * 7. power-ups: os atingidos por chama nova queimam, caixas destruidas
 *    sorteiam novos, quem pisa coleta
 * 8. morte subita fecha os aneis devidos
 * 9. vitoria
 *
 * Nao muta o estado de entrada.
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

export { createStaticGrid } from "../rules/map-generation.js";

/**
 * Jogador novo no centro do spawn indicado. O slot define cor e placar; o
 * spawn e sorteado por rodada em createMatchState.
 */
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

export function step(
  state: MatchState,
  rawInputs: InputsByPlayer,
  dt: number,
): MatchState {
  const elapsed = state.elapsed + dt;

  if (state.phase === MatchPhase.Countdown) {
    return {
      ...state,
      tick: state.tick + 1,
      elapsed,
      phase: elapsed >= 0 ? MatchPhase.Playing : MatchPhase.Countdown,
    };
  }

  const finished = state.phase === MatchPhase.Finished;
  const inputs: InputsByPlayer = finished ? {} : rawInputs;

  // 1. movimento
  let players = state.players.map((player) => {
    if (!player.alive) {
      return player;
    }
    const input = inputs[player.id] ?? IDLE_INPUT;
    const solid = solidFor(state.grid, state.bombs, player);
    const pos = movePlayer(solid, player, input, dt);
    return { ...player, x: pos.x, y: pos.y, facing: pos.facing ?? player.facing };
  });

  // 2. soltar bomba
  let bombs = [...state.bombs];
  let nextEntityId = state.nextEntityId;
  players = players.map((player) => {
    if (inputs[player.id]?.bomb !== true || !canPlaceBomb(state.grid, bombs, player)) {
      return player;
    }
    bombs.push(createBomb(nextEntityId, player));
    nextEntityId += 1;
    return { ...player, bombsPlaced: player.bombsPlaced + 1 };
  });

  // 3. pavio
  bombs = tickFuses(bombs, dt);

  // 4. detonacao
  const litCells = flameCells(state.explosions);
  const triggers = [
    ...expiredBombIds(bombs),
    ...bombs.filter((b) => litCells.has(cellIndex(b.x, b.y))).map((b) => b.id),
  ];
  const chain = detonate(state.grid, bombs, triggers, nextEntityId);
  bombs = chain.remaining;
  nextEntityId = chain.nextEntityId;

  if (chain.detonated.length > 0) {
    players = players.map((player) => {
      const owned = chain.detonated.filter((b) => b.ownerId === player.id).length;
      return owned === 0 ? player : { ...player, bombsPlaced: player.bombsPlaced - owned };
    });
  }

  let grid = state.grid;
  if (chain.cratesDestroyed.size > 0) {
    grid = cloneGrid(grid);
    for (const index of chain.cratesDestroyed) {
      setCell(grid, cellX(index), cellY(index), CellKind.Floor);
    }
  }

  // 5. chamas
  const explosions = [
    ...state.explosions
      .map((e) => ({ ...e, remaining: e.remaining - dt }))
      .filter((e) => e.remaining > 0),
    ...chain.explosions,
  ];

  // 6. dano
  players = applyDamage(players, flameCells(explosions));

  // 7. power-ups
  let powerUps = burnPowerUps(state.powerUps, flameCells(chain.explosions));
  const drops = rollDrops(chain.cratesDestroyed, state.rng);
  powerUps = [...powerUps, ...drops.powerUps];
  const collected = collectPowerUps(players, powerUps);
  players = collected.players;
  powerUps = collected.powerUps;

  const next: MatchState = {
    ...state,
    tick: state.tick + 1,
    elapsed,
    grid,
    players,
    bombs,
    explosions,
    powerUps,
    nextEntityId,
    rng: drops.rng,
  };
  if (finished) {
    return next;
  }

  // 8. morte subita
  const closed = closeRings(next, elapsed);
  const phase = closed.ringsClosed > 0 ? MatchPhase.SuddenDeath : MatchPhase.Playing;

  // 9. vitoria
  const outcome = checkVictory(closed.players, elapsed);

  return {
    ...next,
    ...closed,
    phase: outcome.finished ? MatchPhase.Finished : phase,
    winnerId: outcome.winnerId,
  };
}
