import { describe, expect, it } from "vitest";
import {
  nextChance,
  nextFloat,
  nextInt,
  nextUint32,
  seedRng,
  shuffle,
} from "../src/simulation/rng.js";

describe("rng com semente", () => {
  it("da a mesma sequencia para a mesma semente", () => {
    const run = (): number[] => {
      let state = seedRng(1234);
      const values: number[] = [];
      for (let i = 0; i < 64; i += 1) {
        const [value, next] = nextUint32(state);
        values.push(value);
        state = next;
      }
      return values;
    };

    expect(run()).toEqual(run());
  });

  it("da sequencias diferentes para sementes diferentes", () => {
    const [a] = nextUint32(seedRng(1));
    const [b] = nextUint32(seedRng(2));
    expect(a).not.toBe(b);
  });

  it("nao muta o estado que recebe", () => {
    const state = seedRng(99);
    nextUint32(state);
    const [first] = nextUint32(state);
    const [second] = nextUint32(state);
    expect(first).toBe(second);
  });

  it("mantem nextFloat em [0, 1)", () => {
    let state = seedRng(7);
    for (let i = 0; i < 2000; i += 1) {
      const [value, next] = nextFloat(state);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      state = next;
    }
  });

  it("mantem nextInt dentro do limite", () => {
    let state = seedRng(42);
    for (let i = 0; i < 2000; i += 1) {
      const [value, next] = nextInt(state, 13);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(13);
      state = next;
    }
  });

  it("aproxima a probabilidade pedida", () => {
    let state = seedRng(2024);
    let hits = 0;
    const rolls = 20_000;
    for (let i = 0; i < rolls; i += 1) {
      const [value, next] = nextChance(state, 0.3);
      if (value) {
        hits += 1;
      }
      state = next;
    }
    expect(hits / rolls).toBeCloseTo(0.3, 1);
  });

  it("embaralha de forma deterministica e sem perder elementos", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const [a] = shuffle(items, seedRng(5));
    const [b] = shuffle(items, seedRng(5));
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(items);
    expect(items[0]).toBe(0);
  });
});
