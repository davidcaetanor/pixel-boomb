/**
 * Posicao continua em unidades de celula. Jogadores nao colidem entre si, o que
 * dispensa reconciliacao com rollback na rede.
 */
export const Facing = {
  North: "north",
  South: "south",
  East: "east",
  West: "west",
} as const;

export type Facing = (typeof Facing)[keyof typeof Facing];

export interface Player {
  readonly id: string;
  /** 0 a 7: cor e posicao no placar. */
  readonly slot: number;
  x: number;
  y: number;
  /** Direcao do ultimo movimento aceito, derivada da intencao e nao do deslocamento. */
  facing: Facing;
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
