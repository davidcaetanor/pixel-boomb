export const PowerUpKind = {
  /** +1 bomba simultanea. */
  Bomb: 0,
  /** +1 celula de alcance. */
  Range: 1,
  /** +0,4 celula/s de velocidade. */
  Speed: 2,
} as const;

export type PowerUpKind = (typeof PowerUpKind)[keyof typeof PowerUpKind];

export const POWER_UP_KINDS: readonly PowerUpKind[] = [
  PowerUpKind.Bomb,
  PowerUpKind.Range,
  PowerUpKind.Speed,
];

/** Power-up alinhado a uma celula. */
export interface PowerUp {
  readonly kind: PowerUpKind;
  readonly x: number;
  readonly y: number;
}
