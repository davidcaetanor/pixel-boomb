/** O que uma celula da grade e. */
export const CellKind = {
  Floor: 0,
  /** Indestrutivel: borda, pilar ou anel fechado pela morte subita. */
  Wall: 1,
  /** Destrutivel pela explosao; pode liberar um power-up. */
  Crate: 2,
} as const;

export type CellKind = (typeof CellKind)[keyof typeof CellKind];

/** Celula bloqueia movimento? */
export function blocksMovement(kind: CellKind): boolean {
  return kind !== CellKind.Floor;
}

/** Celula interrompe a propagacao da chama? */
export function stopsFlame(kind: CellKind): boolean {
  return kind !== CellKind.Floor;
}
