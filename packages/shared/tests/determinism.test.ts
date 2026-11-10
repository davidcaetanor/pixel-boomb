import { describe, expect, it } from "vitest";
import { TICK_SECONDS } from "../src/config/balance.js";
import type { InputCommand, InputsByPlayer } from "../src/commands/input-command.js";
import type { MatchState } from "../src/domain/match-state.js";
import { nextInt, seedRng, type RngState } from "../src/simulation/rng.js";
import { createMatchState, step } from "../src/simulation/step.js";

const IDS = ["a", "b", "c", "d"];
const MOVES: InputCommand[] = [
  { moveX: 1, moveY: 0 },
  { moveX: -1, moveY: 0 },
  { moveX: 0, moveY: 1 },
  { moveX: 0, moveY: -1 },
  { moveX: 0, moveY: 0 },
  { moveX: 1, moveY: 1, prefer: "y" },
];

/** Roteiro de entrada gerado por semente, igual nas duas execucoes. */
function script(seed: number, ticks: number): InputsByPlayer[] {
  let rng: RngState = seedRng(seed);
  const out: InputsByPlayer[] = [];
  for (let t = 0; t < ticks; t += 1) {
    const frame: Record<string, InputCommand> = {};
    for (const id of IDS) {
      const [pick, afterPick] = nextInt(rng, MOVES.length);
      const [drop, afterDrop] = nextInt(afterPick, 20);
      rng = afterDrop;
      frame[id] = { ...(MOVES[pick] as InputCommand), bomb: drop === 0 };
    }
    out.push(frame);
  }
  return out;
}

function play(seed: number, inputs: readonly InputsByPlayer[]): MatchState {
  let state = createMatchState(seed, IDS);
  for (const frame of inputs) {
    state = step(state, frame, TICK_SECONDS);
  }
  return state;
}

/** Forma comparavel: Uint8Array vira array comum. */
function snapshot(state: MatchState): unknown {
  return { ...state, grid: { ...state.grid, cells: [...state.grid.cells] } };
}

describe("determinismo", () => {
  it.each([1, 42, 2024, 99999])("mesma semente e entrada dao o mesmo estado (semente %i)", (seed) => {
    const inputs = script(seed, 30 * 60);
    expect(snapshot(play(seed, inputs))).toEqual(snapshot(play(seed, inputs)));
  });

  it("estado intermediario tambem bate, tick a tick", () => {
    const inputs = script(7, 600);
    let a = createMatchState(7, IDS);
    let b = createMatchState(7, IDS);
    for (const frame of inputs) {
      a = step(a, frame, TICK_SECONDS);
      b = step(b, frame, TICK_SECONDS);
      expect(snapshot(a)).toEqual(snapshot(b));
    }
  });

  it("semente diferente da partida diferente", () => {
    const inputs = script(3, 300);
    expect(snapshot(play(3, inputs))).not.toEqual(snapshot(play(4, inputs)));
  });
});
