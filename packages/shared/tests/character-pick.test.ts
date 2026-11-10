import { describe, expect, it } from "vitest";
import {
  CHARACTER_COUNT,
  canPickCharacter,
  firstFreeCharacter,
  isCharacterIndex,
} from "../src/rules/character-pick.js";

describe("escolha de personagem", () => {
  it("o elenco cobre todas as vagas da sala", () => {
    expect(CHARACTER_COUNT).toBe(8);
  });

  it("primeiro livre pula os escolhidos", () => {
    expect(firstFreeCharacter([])).toBe(0);
    expect(firstFreeCharacter([0, 1, 3])).toBe(2);
    expect(firstFreeCharacter([0, 1, 2, 3, 4, 5, 6, 7])).toBeNull();
  });

  it("nao deixa escolher personagem de outro jogador", () => {
    expect(canPickCharacter([2, 5], 2)).toBe(false);
    expect(canPickCharacter([2, 5], 3)).toBe(true);
  });

  it("rejeita indice fora do elenco ou que nao seja inteiro", () => {
    for (const value of [-1, 8, 1.5, "1", null, undefined, Number.NaN]) {
      expect(isCharacterIndex(value)).toBe(false);
      expect(canPickCharacter([], value)).toBe(false);
    }
  });
});
