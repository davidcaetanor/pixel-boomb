/**
 * Todo numero de jogo do PixelBoom vive aqui. Nenhum literal magico espalhado
 * pelo codigo. O porque de cada valor esta em docs/02-game-design.md; este
 * arquivo e a fonte de verdade.
 *
 * Layout da arena nao mora aqui: mora em ./arena.ts.
 */
export const BALANCE = {
  /** Progressao do jogador. Velocidade em celulas por segundo. */
  player: {
    speedInitial: 3.5,
    speedStep: 0.4,
    speedMax: 6,

    bombsInitial: 1,
    bombsStep: 1,
    bombsMax: 6,

    rangeInitial: 2,
    rangeStep: 1,
    rangeMax: 6,

    /**
     * Lado da caixa de colisao do jogador, em celulas. Menor que 1 para caber
     * no corredor com folga; o desvio de quina cuida do alinhamento.
     */
    hitboxSize: 0.8,
  },

  /** Colisao contra a grade. */
  physics: {
    /**
     * Folga numerica para que encostar exatamente na borda de uma celula
     * nao conte como estar dentro dela.
     */
    collisionEpsilon: 1e-9,
  },

  /** Tempos, sempre em segundos. */
  time: {
    bombFuse: 2.5,
    flameOnScreen: 0.5,
    countdown: 3,
    suddenDeathStart: 90,
    suddenDeathRingInterval: 15,
    matchMax: 180,
    /** Pausa entre o fim de uma rodada online e o inicio da proxima. */
    roundRestartDelay: 5,
  },

  /** Geracao do mapa. Fracoes de 0 a 1. */
  mapGeneration: {
    crateDensityMin: 0.55,
    crateDensityMax: 0.65,
    powerUpChance: 0.3,
  },

  /** Cadencias. A simulacao e passo fixo; o render nunca manda nela. */
  simulation: {
    tickHz: 30,
    deltaClampMs: 100,
  },

  /** Rede. Mora aqui para que nenhum numero fique solto no cliente. */
  net: {
    patchesPerSecond: 30,
    interpolationBufferMs: 66,
    maxClientsPerRoom: 8,
    /** Jogadores conectados para a sala comecar uma rodada. */
    minPlayersToStart: 2,
    /** Teto de mensagens por cliente; acima disso o servidor descarta. */
    maxMessagesPerSecond: 60,
  },

  /** Formato da partida. */
  match: {
    roundsToWin: 3,
    maxRounds: 5,
  },
} as const;

/** Duracao de um tick da simulacao, em segundos. */
export const TICK_SECONDS = 1 / BALANCE.simulation.tickHz;

export type Balance = typeof BALANCE;
