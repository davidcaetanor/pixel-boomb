import { describe, expect, it } from "vitest";
import { playingMatch } from "./helpers.js";
import { BALANCE, TICK_SECONDS } from "../src/config/balance.js";
import { IDLE_INPUT, type InputCommand } from "../src/commands/input-command.js";
import { InputQueue } from "../src/commands/input-queue.js";
import { InputHistory } from "../src/commands/sequence.js";
import { createStaticGrid } from "../src/rules/map-generation.js";
import { replayInputs } from "../src/simulation/prediction.js";
import { step } from "../src/simulation/step.js";

const RIGHT: InputCommand = { moveX: 1, moveY: 0 };
const DOWN: InputCommand = { moveX: 0, moveY: 1 };
const TURN: InputCommand = { moveX: 1, moveY: 1, prefer: "y" };

function match() {
  const base = playingMatch(3, ["a", "b"]);
  return {
    ...base,
    grid: createStaticGrid(),
    players: base.players.map((p, i) => ({ ...p, x: 1.5 + i * 10, y: 1.5 })),
  };
}

describe("predicao", () => {
  it("chega a mesma posicao que a simulacao do servidor", () => {
    const inputs = [...Array(10).fill(RIGHT), ...Array(15).fill(TURN), ...Array(10).fill(DOWN)];
    let server = match();
    for (const input of inputs) {
      server = step(server, { a: input }, TICK_SECONDS);
    }
    const start = match();
    const predicted = replayInputs(start, start.players[0]!, inputs);
    expect(predicted.x).toBeCloseTo(server.players[0]!.x, 10);
    expect(predicted.y).toBeCloseTo(server.players[0]!.y, 10);
    expect(predicted.facing).toBe(server.players[0]!.facing);
  });

  it("reconcilia: estado confirmado mais pendentes da o mesmo que tudo previsto", () => {
    const inputs = [...Array(20).fill(RIGHT), ...Array(10).fill(TURN)];
    const start = match();
    const allPredicted = replayInputs(start, start.players[0]!, inputs);
    const confirmed = replayInputs(start, start.players[0]!, inputs.slice(0, 12));
    const reconciled = replayInputs(start, confirmed, inputs.slice(12));
    expect(reconciled).toEqual(allPredicted);
  });

  it("jogador morto nao se move", () => {
    const start = match();
    const dead = { ...start.players[0]!, alive: false };
    expect(replayInputs(start, dead, [RIGHT, RIGHT])).toEqual(dead);
  });
});

describe("InputHistory", () => {
  it("numera em ordem e descarta o que foi confirmado", () => {
    const history = new InputHistory();
    const seqs = [RIGHT, RIGHT, DOWN, DOWN].map((i) => history.record(i).seq);
    expect(seqs).toEqual([1, 2, 3, 4]);
    expect(history.acknowledge(2).map((e) => e.seq)).toEqual([3, 4]);
    expect(history.acknowledge(4)).toEqual([]);
  });
});

describe("InputQueue", () => {
  it("consome uma entrada por tick e confirma o numero", () => {
    const queue = new InputQueue();
    queue.push({ seq: 1, input: RIGHT });
    queue.push({ seq: 2, input: DOWN });
    expect(queue.next()).toEqual(RIGHT);
    expect(queue.acknowledged).toBe(1);
    expect(queue.next()).toEqual(DOWN);
    expect(queue.acknowledged).toBe(2);
  });

  it("ignora numero repetido ou antigo", () => {
    const queue = new InputQueue();
    queue.push({ seq: 5, input: RIGHT });
    queue.push({ seq: 5, input: DOWN });
    queue.push({ seq: 3, input: DOWN });
    expect(queue.next()).toEqual(RIGHT);
    expect(queue.next()).toEqual(IDLE_INPUT);
  });

  it("sem entrada nova fica parado, para nao aplicar a mesma entrada duas vezes", () => {
    const queue = new InputQueue();
    queue.push({ seq: 1, input: { ...RIGHT, bomb: true } });
    expect(queue.next().bomb).toBe(true);
    expect(queue.next()).toEqual(IDLE_INPUT);
    expect(queue.acknowledged).toBe(1);
  });

  it("limita a fila descartando as mais antigas", () => {
    const queue = new InputQueue();
    const total = BALANCE.net.maxQueuedInputs + 4;
    for (let seq = 1; seq <= total; seq += 1) {
      queue.push({ seq, input: RIGHT });
    }
    expect(queue.acknowledged).toBe(4);
    queue.next();
    expect(queue.acknowledged).toBe(5);
  });
});
