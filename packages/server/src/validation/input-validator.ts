/** Aceita apenas mensagens com o formato exato de uma entrada numerada; o resto vira null. */
import type { AxisIntent, InputCommand, MoveAxis, SequencedInput } from "@pixelboom/shared";

const ALLOWED_KEYS = new Set(["seq", "moveX", "moveY", "prefer", "bomb"]);

function axis(value: unknown): AxisIntent | null {
  return value === -1 || value === 0 || value === 1 ? value : null;
}

function prefer(value: unknown): MoveAxis | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  return value === "x" || value === "y" ? value : null;
}

function sequence(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function parseInput(raw: unknown): SequencedInput | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const msg = raw as Record<string, unknown>;
  if (Object.keys(msg).some((k) => !ALLOWED_KEYS.has(k))) {
    return null;
  }

  const seq = sequence(msg["seq"]);
  const moveX = axis(msg["moveX"]);
  const moveY = axis(msg["moveY"]);
  const pref = prefer(msg["prefer"]);
  const bomb = msg["bomb"];
  if (seq === null || moveX === null || moveY === null || pref === null) {
    return null;
  }
  if (bomb !== undefined && typeof bomb !== "boolean") {
    return null;
  }

  const input: InputCommand = {
    moveX,
    moveY,
    ...(pref !== undefined ? { prefer: pref } : {}),
    ...(bomb === true ? { bomb: true } : {}),
  };
  return { seq, input };
}

/** Escolha de personagem: `{ index }` com inteiro. O dominio do indice e validado pela regra. */
export function parseCharacterPick(raw: unknown): number | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const keys = Object.keys(raw);
  const index = (raw as Record<string, unknown>)["index"];
  if (keys.length !== 1 || typeof index !== "number" || !Number.isInteger(index)) {
    return null;
  }
  return index;
}
