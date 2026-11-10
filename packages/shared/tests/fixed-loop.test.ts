import { describe, expect, it } from "vitest";
import { BALANCE, TICK_SECONDS } from "../src/config/balance.js";
import { advance, createFixedLoop, interpolationAlpha } from "../src/simulation/fixed-loop.js";

describe("loop de passo fixo", () => {
  it("roda 30 ticks em um segundo", () => {
    const loop = createFixedLoop();
    let ticks = 0;
    for (let i = 0; i < 60; i += 1) {
      ticks += advance(loop, 1 / 60);
    }
    expect(ticks).toBe(BALANCE.simulation.tickHz);
  });

  it("nao roda tick sem delta suficiente", () => {
    const loop = createFixedLoop();
    expect(advance(loop, TICK_SECONDS / 2)).toBe(0);
    expect(advance(loop, TICK_SECONDS / 2)).toBe(1);
  });

  it("limita o delta para a aba em segundo plano nao disparar centenas de ticks", () => {
    const loop = createFixedLoop();
    const ticks = advance(loop, 30);
    const maxTicks = Math.floor(
      BALANCE.simulation.deltaClampMs / 1000 / TICK_SECONDS,
    );
    expect(ticks).toBeLessThanOrEqual(maxTicks);
    expect(ticks).toBe(3);
  });

  it("ignora delta negativo", () => {
    const loop = createFixedLoop();
    expect(advance(loop, -5)).toBe(0);
    expect(loop.accumulator).toBe(0);
  });

  it("expoe alpha entre 0 e 1 para o render interpolar", () => {
    const loop = createFixedLoop();
    advance(loop, TICK_SECONDS * 0.5);
    expect(interpolationAlpha(loop)).toBeCloseTo(0.5, 5);
  });
});
