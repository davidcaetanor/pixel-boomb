/**
 * Entrada numerada por tick do cliente. O servidor informa o ultimo numero
 * processado, e o cliente descarta o que ja foi confirmado.
 */
import type { InputCommand } from "./input-command.js";

export interface SequencedInput {
  readonly seq: number;
  readonly input: InputCommand;
}

/** Fila de entradas aguardando confirmacao, em ordem de envio. */
export class InputHistory {
  private entries: SequencedInput[] = [];
  private nextSeq = 1;

  record(input: InputCommand): SequencedInput {
    const entry = { seq: this.nextSeq, input };
    this.nextSeq += 1;
    this.entries.push(entry);
    return entry;
  }

  /** Remove as confirmadas e devolve as que o servidor ainda nao aplicou. */
  acknowledge(ackSeq: number): readonly SequencedInput[] {
    this.entries = this.entries.filter((e) => e.seq > ackSeq);
    return this.entries;
  }

  clear(): void {
    this.entries = [];
  }
}
