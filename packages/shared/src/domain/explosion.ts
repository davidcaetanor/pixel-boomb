/** Chama de uma explosao em cruz e o tempo que ainda permanece ativa. */
export interface Explosion {
  readonly id: number;
  readonly ownerId: string;
  /** Celulas atingidas; a primeira e a da bomba. */
  readonly cells: readonly number[];
  /** Segundos restantes de chama. */
  remaining: number;
}
