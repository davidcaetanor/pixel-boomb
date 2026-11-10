/**
 * Posicao em ponto flutuante, em unidades de celula. O jogador desliza; a
 * bomba e que trava no centro da celula.
 *
 * Nao existe colisao entre jogadores: eles se atravessam. Essa e a decisao
 * que elimina a necessidade de reconciliacao com rollback.
 */
export interface Player {
  readonly id: string;
  /** 0 a 7: define cor, spawn e posicao no placar. */
  readonly slot: number;
  x: number;
  y: number;
  /** Celulas por segundo. */
  speed: number;
  /** Bombas simultaneas permitidas. */
  maxBombs: number;
  /** Alcance da explosao, em celulas. */
  range: number;
  /** Bombas no chao agora. */
  bombsPlaced: number;
  alive: boolean;
  /** Rodadas ganhas na serie melhor-de-cinco. */
  roundsWon: number;
}
