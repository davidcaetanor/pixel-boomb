/**
 * Fila de entradas de um jogador no servidor: uma consumida por tick. Numeros
 * repetidos ou antigos sao ignorados, e o excesso descarta as mais antigas
 * para a latencia nao acumular. Sem entrada disponivel o jogador fica parado:
 * cada entrada e aplicada exatamente uma vez, como na predicao do cliente.
 */
import { BALANCE } from "../config/balance.js";
import { IDLE_INPUT, type InputCommand } from "./input-command.js";
import type { SequencedInput } from "./sequence.js";

export class InputQueue {
  private queue: SequencedInput[] = [];
  private lastReceived = 0;
  private processed = 0;

  push(entry: SequencedInput): void {
    if (entry.seq <= this.lastReceived) {
      return;
    }
    this.lastReceived = entry.seq;
    this.queue.push(entry);
    while (this.queue.length > BALANCE.net.maxQueuedInputs) {
      const dropped = this.queue.shift();
      if (dropped !== undefined) {
        this.processed = dropped.seq;
      }
    }
  }

  /** Entrada deste tick. */
  next(): InputCommand {
    const entry = this.queue.shift();
    if (entry === undefined) {
      return IDLE_INPUT;
    }
    this.processed = entry.seq;
    return entry.input;
  }

  /** Ultimo numero de sequencia aplicado ou descartado. */
  get acknowledged(): number {
    return this.processed;
  }
}
