/** Bomba no chao, sempre no centro de uma celula. Uma por celula. */
export interface Bomb {
  readonly id: number;
  readonly ownerId: string;
  /** Celula, inteiro. */
  readonly x: number;
  readonly y: number;
  readonly range: number;
  /** Segundos restantes de pavio. */
  fuseRemaining: number;
  /**
   * O dono pode sair de cima da bomba; depois que sai, nao pode voltar.
   * Enquanto estiver sobre ela, a celula nao bloqueia o movimento dele.
   */
  ownerStillOnTop: boolean;
}
