/**
 * Predicao do jogador local: cada entrada e aplicada na hora e guardada ate o
 * servidor confirmar. A cada estado recebido, a posicao confirmada recebe as
 * entradas ainda pendentes. A numeracao dura a conexao inteira, entre rodadas.
 */
import {
  InputHistory,
  predictStep,
  replayInputs,
  type InputCommand,
  type Player,
  type PredictionWorld,
  type SequencedInput,
} from "@pixelboom/shared";

export class LocalPrediction {
  private readonly history = new InputHistory();
  private current: Player | null = null;
  private previous: Player | null = null;

  /**
   * Registra a entrada de um tick e devolve a versao numerada para envio. Fora
   * das fases de jogo o servidor ignora movimento, entao a posicao nao avanca.
   */
  apply(world: PredictionWorld, input: InputCommand, moving: boolean): SequencedInput {
    const entry = this.history.record(input);
    if (this.current !== null) {
      this.previous = this.current;
      this.current = moving ? predictStep(world, this.current, input) : this.current;
    }
    return entry;
  }

  reconcile(world: PredictionWorld, confirmed: Player, ackSeq: number, moving: boolean): void {
    const pending = this.history.acknowledge(ackSeq).map((e) => e.input);
    const reconciled = moving ? replayInputs(world, confirmed, pending) : confirmed;
    this.previous = this.current ?? reconciled;
    this.current = reconciled;
  }

  /** Descarta a posicao prevista, mantendo a numeracao. */
  forgetPosition(): void {
    this.current = null;
    this.previous = null;
  }

  /** Estados dos dois ultimos ticks previstos, para interpolacao no desenho. */
  get frames(): { readonly previous: Player; readonly current: Player } | null {
    if (this.current === null) {
      return null;
    }
    return { previous: this.previous ?? this.current, current: this.current };
  }
}

const byRoom = new WeakMap<object, LocalPrediction>();

export function predictionFor(room: object): LocalPrediction {
  let prediction = byRoom.get(room);
  if (prediction === undefined) {
    prediction = new LocalPrediction();
    byRoom.set(room, prediction);
  }
  return prediction;
}
