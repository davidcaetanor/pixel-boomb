/**
 * Escolha de personagem na sala de espera: um personagem por jogador, sem
 * repeticao. O elenco tem um personagem por vaga da sala.
 */
import { BALANCE } from "../config/balance.js";

export const CHARACTER_COUNT = BALANCE.net.maxClientsPerRoom;

export function isCharacterIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < CHARACTER_COUNT;
}

export function firstFreeCharacter(taken: Iterable<number>): number | null {
  const used = new Set(taken);
  for (let index = 0; index < CHARACTER_COUNT; index += 1) {
    if (!used.has(index)) {
      return index;
    }
  }
  return null;
}

/** `taken` sao os personagens dos outros jogadores, sem o de quem esta escolhendo. */
export function canPickCharacter(taken: Iterable<number>, index: unknown): index is number {
  return isCharacterIndex(index) && !new Set(taken).has(index);
}
