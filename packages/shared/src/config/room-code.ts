/**
 * Codigo de sala: letras sem ambiguidade visual (sem I, L, O nem U), para ser
 * ditado ou digitado sem erro.
 */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ";
export const ROOM_CODE_LENGTH = 5;

const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

/** Normaliza para maiusculas e valida o formato. */
export function parseRoomCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return ROOM_CODE_PATTERN.test(code) ? code : null;
}
