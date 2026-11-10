/** Bomba alinhada a uma celula. O bloqueio de passagem e definido por solidFor. */
export interface Bomb {
  readonly id: number;
  readonly ownerId: string;
  /** Coordenadas de celula. */
  readonly x: number;
  readonly y: number;
  readonly range: number;
  /** Segundos restantes de pavio. */
  fuseRemaining: number;
}
