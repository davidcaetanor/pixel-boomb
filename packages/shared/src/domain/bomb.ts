/**
 * Bomba no chao, sempre no centro de uma celula. Uma por celula.
 *
 * Quem estava em cima ao ser solta pode sair, mas nao voltar: a regra mora em
 * rules/bomb-placement.ts (bombSolidFor) e vale para qualquer jogador.
 */
export interface Bomb {
  readonly id: number;
  readonly ownerId: string;
  /** Celula, inteiro. */
  readonly x: number;
  readonly y: number;
  readonly range: number;
  /** Segundos restantes de pavio. */
  fuseRemaining: number;
}
