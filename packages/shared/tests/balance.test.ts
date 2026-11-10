import { describe, expect, it } from "vitest";
import { BALANCE, TICK_SECONDS } from "../src/config/balance.js";
import { TILE_SIZE } from "../src/config/arena.js";

describe("balanceamento", () => {
  it("mantem a verificacao de escape de docs/02-game-design.md", () => {
    // A 3,5 celulas/s o jogador percorre 8,75 celulas durante um pavio de 2,5 s.
    // Se mexer na velocidade ou no pavio, este teste cobra a conta refeita.
    const { speedInitial } = BALANCE.player;
    const distancia = speedInitial * BALANCE.time.bombFuse;
    expect(distancia).toBeCloseTo(8.75, 5);
    expect(distancia).toBeGreaterThan(BALANCE.player.rangeInitial + 1);
    expect(speedInitial * TILE_SIZE).toBe(112);
  });

  it("mantem progressao de 3x no alcance", () => {
    const { rangeInitial, rangeMax } = BALANCE.player;
    expect(rangeMax / rangeInitial).toBe(3);
  });

  it("nao deixa nenhum teto abaixo do valor inicial", () => {
    const p = BALANCE.player;
    expect(p.speedMax).toBeGreaterThan(p.speedInitial);
    expect(p.bombsMax).toBeGreaterThan(p.bombsInitial);
    expect(p.rangeMax).toBeGreaterThan(p.rangeInitial);
  });

  it("mantem a densidade de caixas num intervalo valido", () => {
    const { crateDensityMin, crateDensityMax, powerUpChance } =
      BALANCE.mapGeneration;
    expect(crateDensityMin).toBeLessThan(crateDensityMax);
    expect(crateDensityMax).toBeLessThanOrEqual(1);
    expect(powerUpChance).toBeGreaterThan(0);
    expect(powerUpChance).toBeLessThan(1);
  });

  it("casa tickHz com TICK_SECONDS", () => {
    expect(TICK_SECONDS * BALANCE.simulation.tickHz).toBeCloseTo(1, 10);
  });

  it("cabe 8 jogadores na sala", () => {
    expect(BALANCE.net.maxClientsPerRoom).toBe(8);
  });
});
