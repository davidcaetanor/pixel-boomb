/**
 * Acumulador de passo fixo, reusado no cliente e no servidor.
 *
 * Tres relogios separados: render na taxa do monitor, simulacao a 30 Hz, rede
 * a 30 patches/s. Amarrar render a simulacao faz o jogo depender do framerate
 * da maquina, o que e o bug mais chato de diagnosticar depois.
 *
 * O clamp de delta nao e detalhe: ao voltar de uma aba em segundo plano o
 * delta acumulado e enorme e a simulacao dispara centenas de ticks de uma vez.
 * Sem clamp isso vira um bug que parece problema de rede.
 */
import { BALANCE, TICK_SECONDS } from "../config/balance.js";

export interface FixedLoopState {
  /** Segundos ainda nao consumidos por um tick. */
  accumulator: number;
}

export function createFixedLoop(): FixedLoopState {
  return { accumulator: 0 };
}

const MAX_DELTA_SECONDS = BALANCE.simulation.deltaClampMs / 1000;

/**
 * Consome o delta e devolve quantos ticks devem rodar agora.
 * O chamador roda o step essa quantidade de vezes, sempre com TICK_SECONDS.
 */
export function advance(loop: FixedLoopState, deltaSeconds: number): number {
  const clamped = Math.min(Math.max(deltaSeconds, 0), MAX_DELTA_SECONDS);
  loop.accumulator += clamped;

  let ticks = 0;
  while (loop.accumulator >= TICK_SECONDS) {
    loop.accumulator -= TICK_SECONDS;
    ticks += 1;
  }

  return ticks;
}

/**
 * Fracao do proximo tick ja acumulada, de 0 a 1. O render usa isso para
 * interpolar entre o tick anterior e o atual e nao mostrar movimento em degraus.
 */
export function interpolationAlpha(loop: FixedLoopState): number {
  return loop.accumulator / TICK_SECONDS;
}
