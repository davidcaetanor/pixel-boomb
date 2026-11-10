/**
 * Acumulador de passo fixo, usado no cliente e no servidor para desacoplar a
 * simulacao da taxa de quadros. O delta e limitado para que uma pausa longa,
 * como uma aba em segundo plano, nao dispare uma rajada de ticks.
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

/** Consome o delta e devolve quantos ticks de TICK_SECONDS devem rodar. */
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

/** Fracao do proximo tick ja acumulada, de 0 a 1, para interpolacao. */
export function interpolationAlpha(loop: FixedLoopState): number {
  return loop.accumulator / TICK_SECONDS;
}
