/**
 * Chama de uma explosao em cruz, nunca diagonal. Guardamos as celulas
 * atingidas e quanto tempo a chama ainda aparece na tela.
 */
export interface Explosion {
  readonly id: number;
  readonly ownerId: string;
  /** Indices de celula atingidos. O primeiro e sempre a celula da bomba. */
  readonly cells: readonly number[];
  /** Segundos restantes de chama. */
  remaining: number;
}
