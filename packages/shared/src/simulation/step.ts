/**
 * A funcao pura da simulacao: (estado, comandos, dt) => novo estado.
 *
 * Primeiro esqueleto (E1): so movimento. Bomba, explosao, morte e fases
 * entram aqui nas proximas etapas, cada uma vinda de shared/rules.
 *
 * Nao muta o estado de entrada: cliente (predicao) e servidor (autoridade)
 * podem guardar o anterior para interpolar ou comparar.
 */
import { IDLE_INPUT, type InputsByPlayer } from "../commands/input-command.js";
import { BALANCE } from "../config/balance.js";
import { CELL_CENTER, SPAWN_POINTS, isStaticWall } from "../config/arena.js";
import { CellKind } from "../domain/cell.js";
import { emptyGrid, setCell, type Grid } from "../domain/grid.js";
import { MatchPhase, type MatchState } from "../domain/match-state.js";
import { Facing, type Player } from "../domain/player.js";
import { movePlayer } from "../rules/movement.js";
import { seedRng } from "./rng.js";

/** Grade so com borda e pilares. Caixas chegam com map-generation (E2). */
export function createStaticGrid(): Grid {
  const grid = emptyGrid();
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      if (isStaticWall(x, y)) {
        setCell(grid, x, y, CellKind.Wall);
      }
    }
  }
  return grid;
}

/** Jogador novo no centro da celula de spawn do seu slot. */
export function createPlayer(id: string, slot: number): Player {
  const spawn = SPAWN_POINTS[slot % SPAWN_POINTS.length] ?? SPAWN_POINTS[0];
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
  return {
    tick: 0,
    elapsed: 0,
    phase: MatchPhase.Playing,
    grid: createStaticGrid(),
    players: playerIds.map((id, slot) => createPlayer(id, slot)),
    bombs: [],
    explosions: [],
    powerUps: [],
    ringsClosed: 0,
    nextEntityId: 1,
    rng: seedRng(seed),
  };
}

export function step(
  state: MatchState,
  inputs: InputsByPlayer,
  dt: number,
): MatchState {
  const players = state.players.map((player) => {
    if (!player.alive) {
      return { ...player };
    }
    const input = inputs[player.id] ?? IDLE_INPUT;
    const pos = movePlayer(state.grid, player, input, dt);
    return { ...player, x: pos.x, y: pos.y, facing: pos.facing ?? player.facing };
  });

  return {
    ...state,
    tick: state.tick + 1,
    elapsed: state.elapsed + dt,
    players,
  };
}
