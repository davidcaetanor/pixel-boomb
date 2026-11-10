/**
 * RNG deterministico (mulberry32) com estado explicito: cada funcao devolve o
 * valor e o proximo estado, sem mutacao.
 */
export type RngState = number;

export function seedRng(seed: number): RngState {
  return seed | 0;
}

/** Proximo inteiro de 32 bits sem sinal. */
export function nextUint32(state: RngState): readonly [value: number, next: RngState] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [(t ^ (t >>> 14)) >>> 0, next];
}

/** Float em [0, 1). */
export function nextFloat(state: RngState): readonly [value: number, next: RngState] {
  const [value, next] = nextUint32(state);
  return [value / 0x1_0000_0000, next];
}

/** Inteiro em [0, maxExclusive). */
export function nextInt(
  state: RngState,
  maxExclusive: number,
): readonly [value: number, next: RngState] {
  const [value, next] = nextFloat(state);
  return [Math.floor(value * maxExclusive), next];
}

/** Float em [min, max). */
export function nextRange(
  state: RngState,
  min: number,
  max: number,
): readonly [value: number, next: RngState] {
  const [value, next] = nextFloat(state);
  return [min + value * (max - min), next];
}

/** true com a probabilidade dada (0 a 1). */
export function nextChance(
  state: RngState,
  probability: number,
): readonly [value: boolean, next: RngState] {
  const [value, next] = nextFloat(state);
  return [value < probability, next];
}

/** Fisher-Yates deterministico; devolve um array novo. */
export function shuffle<T>(
  items: readonly T[],
  state: RngState,
): readonly [value: T[], next: RngState] {
  const result = [...items];
  let current = state;

  for (let i = result.length - 1; i > 0; i -= 1) {
    const [j, next] = nextInt(current, i + 1);
    current = next;
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }

  return [result, current];
}
