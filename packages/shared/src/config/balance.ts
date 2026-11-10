/** Numeros de jogo. Dimensoes e layout da arena ficam em ./arena.ts. */
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

    /** Lado da caixa de colisao do jogador, em celulas. */
    hitboxSize: 0.8,
  },

  /** Colisao contra a grade. */
  physics: {
    /** Tolerancia para que encostar na borda de uma celula nao conte como ocupa-la. */
    collisionEpsilon: 1e-9,
  },

  /** Tempos em segundos. */
  time: {
    bombFuse: 2.5,
    flameOnScreen: 0.5,
    countdown: 3,
    suddenDeathStart: 90,
    suddenDeathRingInterval: 15,
    matchMax: 180,
    /** Pausa entre o fim de uma rodada online e o inicio da proxima. */
    roundRestartDelay: 5,
    /** Pausa entre o fim de uma serie e o inicio da proxima. */
    seriesRestartDelay: 10,
  },

  /** Geracao do mapa. Fracoes de 0 a 1. */
  mapGeneration: {
    crateDensityMin: 0.55,
    crateDensityMax: 0.65,
    powerUpChance: 0.3,
  },

  /** Cadencia da simulacao de passo fixo. */
  simulation: {
    tickHz: 30,
    deltaClampMs: 100,
  },

  /** Rede. */
  net: {
    patchesPerSecond: 30,
    interpolationBufferMs: 66,
    maxClientsPerRoom: 8,
    /** Jogadores conectados para a sala comecar uma rodada. */
    minPlayersToStart: 2,
    /** Mensagens aceitas por cliente por segundo. */
    maxMessagesPerSecond: 60,
    /** Entradas em espera por jogador no servidor, cerca de 200 ms a 30 Hz. */
    maxQueuedInputs: 6,
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
