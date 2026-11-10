/**
 * Sala autoritativa: roda a simulacao de shared e decide o estado; o cliente
 * envia apenas intencao. Aguarda minPlayersToStart, joga a rodada, exibe o
 * resultado por roundRestartDelay e recomeca com quem estiver conectado.
 */
import { Room, type Client } from "@colyseus/core";
import {
  BALANCE,
  IDLE_INPUT,
  MatchPhase,
  TICK_SECONDS,
  advance,
  createFixedLoop,
  createMatchState,
  step,
  type FixedLoopState,
  type InputCommand,
  type MatchState,
} from "@pixelboom/shared";
import { writeMatch, writeWaiting } from "../schema/mappers.js";
import { MatchSchema } from "../schema/match-schema.js";
import { parseInput } from "../validation/input-validator.js";

const MS_PER_SECOND = 1000;
/** Faixa de sementes de 31 bits, a mesma que o RNG de shared aceita. */
const SEED_RANGE = 2 ** 31;

export class MatchRoom extends Room<{ state: MatchSchema }> {
  override maxClients = BALANCE.net.maxClientsPerRoom;
  override maxMessagesPerSecond = BALANCE.net.maxMessagesPerSecond;
  override state = new MatchSchema();

  private match: MatchState | null = null;
  private readonly intents = new Map<string, InputCommand>();
  /** Pedidos de bomba acumulados entre ticks. */
  private readonly bombRequests = new Set<string>();
  private finishedFor = 0;
  /** O timer do sistema nao e preciso o bastante; o acumulador garante a taxa de ticks. */
  private readonly loop: FixedLoopState = createFixedLoop();

  override messages = {
    input: (client: Client, raw: unknown): void => {
      const command = parseInput(raw);
      if (command === null) {
        return;
      }
      this.intents.set(client.sessionId, { ...command, bomb: false });
      if (command.bomb === true) {
        this.bombRequests.add(client.sessionId);
      }
    },
  };

  override onCreate(): void {
    this.setPatchRate(MS_PER_SECOND / BALANCE.net.patchesPerSecond);
    this.setSimulationInterval((deltaMs) => {
      const ticks = advance(this.loop, deltaMs / MS_PER_SECOND);
      for (let i = 0; i < ticks; i += 1) {
        this.tick();
      }
    }, MS_PER_SECOND / BALANCE.simulation.tickHz);
    writeWaiting(this.state, 0);
  }

  override onJoin(): void {
    this.state.connected = this.clients.length;
    if (this.match === null && this.clients.length >= BALANCE.net.minPlayersToStart) {
      this.startRound();
    }
  }

  override onLeave(client: Client): void {
    this.intents.delete(client.sessionId);
    this.bombRequests.delete(client.sessionId);
    this.state.connected = this.clients.length;
    if (this.match !== null) {
      this.match = {
        ...this.match,
        players: this.match.players.map((p) =>
          p.id === client.sessionId ? { ...p, alive: false } : p,
        ),
      };
    }
    if (this.match === null) {
      writeWaiting(this.state, this.clients.length);
    }
  }

  private startRound(): void {
    const seed = Math.floor(Math.random() * SEED_RANGE);
    const ids = this.clients.map((c) => c.sessionId).slice(0, BALANCE.net.maxClientsPerRoom);
    this.match = createMatchState(seed, ids);
    this.intents.clear();
    this.bombRequests.clear();
    this.finishedFor = 0;
    writeMatch(this.state, this.match);
  }

  private tick(): void {
    if (this.match === null) {
      return;
    }

    const frame: Record<string, InputCommand> = {};
    for (const player of this.match.players) {
      const input = this.intents.get(player.id) ?? IDLE_INPUT;
      frame[player.id] = { ...input, bomb: this.bombRequests.has(player.id) };
    }
    this.bombRequests.clear();

    this.match = step(this.match, frame, TICK_SECONDS);
    writeMatch(this.state, this.match);

    if (this.match.phase === MatchPhase.Finished) {
      this.finishedFor += TICK_SECONDS;
      if (this.finishedFor >= BALANCE.time.roundRestartDelay) {
        this.nextRound();
      }
    }
  }

  private nextRound(): void {
    if (this.clients.length >= BALANCE.net.minPlayersToStart) {
      this.startRound();
      return;
    }
    this.match = null;
    writeWaiting(this.state, this.clients.length);
  }
}
