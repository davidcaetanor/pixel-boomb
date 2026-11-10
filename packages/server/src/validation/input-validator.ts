/**
 * Nunca confie no cliente. A mensagem chega como dado qualquer; so passa se
 * tiver exatamente a forma de InputCommand, com valores no dominio esperado.
 * Qualquer outra coisa vira null e e descartada.
 */
import type { AxisIntent, InputCommand, MoveAxis } from "@pixelboom/shared";

function axis(value: unknown): AxisIntent | null {
  return value === -1 || value === 0 || value === 1 ? value : null;
}

function prefer(value: unknown): MoveAxis | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  return value === "x" || value === "y" ? value : null;
}

export function parseInput(raw: unknown): InputCommand | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const msg = raw as Record<string, unknown>;
  const allowed = new Set(["moveX", "moveY", "prefer", "bomb"]);
  if (Object.keys(msg).some((k) => !allowed.has(k))) {
    return null;
  }

  const moveX = axis(msg["moveX"]);
  const moveY = axis(msg["moveY"]);
  const pref = prefer(msg["prefer"]);
  const bomb = msg["bomb"];
  if (moveX === null || moveY === null || pref === null) {
    return null;
  }
  if (bomb !== undefined && typeof bomb !== "boolean") {
    return null;
  }

  const command: InputCommand = { moveX, moveY };
  return {
    ...command,
    ...(pref !== undefined ? { prefer: pref } : {}),
    ...(bomb === true ? { bomb: true } : {}),
  };
}
