/**
 * Sala autoritativa: roda a simulacao de shared e decide o estado; o cliente
 * envia entradas numeradas, consumidas uma por tick. A sala tem um codigo
 * curto como id e uma espera em que cada jogador escolhe personagem. O
 * anfitriao inicia a serie; ao fim dela todos voltam para a espera.
 */
import { Room, type Client } from "@colyseus/core";
import {
  BALANCE,
  InputQueue,
  MatchPhase,
  NEW_SERIES,
  TICK_SECONDS,
  advance,
  applySeriesScore,
  canPickCharacter,
  createFixedLoop,
  createMatchState,
  firstFreeCharacter,
  recordRound,
  step,
  type FixedLoopState,
  type InputCommand,
  type MatchState,
  type Series,
} from "@pixelboom/shared";
import { writeLobby, writeMatch, writeWaiting, type LobbyMember } from "../schema/mappers.js";
import { MatchSchema } from "../schema/match-schema.js";
import { parseCharacterPick, parseInput } from "../validation/input-validator.js";
import { generateRoomCode } from "./room-code.js";

const MS_PER_SECOND = 1000;
/** Faixa de sementes de 31 bits, a mesma que o RNG de shared aceita. */
const SEED_RANGE = 2 ** 31;

export class MatchRoom extends Room<{ state: MatchSchema }> {
  override maxClients = BALANCE.net.maxClientsPerRoom;
  override maxMessagesPerSecond = BALANCE.net.maxMessagesPerSecond;
  override state = new MatchSchema();

  private match: MatchState | null = null;
  private series: Series = NEW_SERIES;
  private readonly queues = new Map<string, InputQueue>();
  private readonly members = new Map<string, LobbyMember>();
  private hostId = "";
  private nextOrder = 0;
  private finishedFor = 0;
  private roundRecorded = false;
  /** O timer do sistema nao e preciso o bastante; o acumulador garante a taxa de ticks. */
  private readonly loop: FixedLoopState = createFixedLoop();

  override messages = {
    input: (client: Client, raw: unknown): void => {
      const entry = parseInput(raw);
      if (entry !== null) {
        this.queues.get(client.sessionId)?.push(entry);
      }
    },
    character: (client: Client, raw: unknown): void => {
      const index = parseCharacterPick(raw);
      const member = this.members.get(client.sessionId);
      if (this.match !== null || member === undefined || index === null) {
        return;
      }
      if (canPickCharacter(this.charactersExcept(client.sessionId), index)) {
        this.members.set(client.sessionId, { ...member, character: index });
        this.publishLobby();
      }
    },
    start: (client: Client): void => {
      const canStart =
        client.sessionId === this.hostId &&
        this.match === null &&
        this.clients.length >= BALANCE.net.minPlayersToStart;
      if (canStart) {
        this.startRound();
      }
    },
  };

  override onCreate(): void {
    this.roomId = generateRoomCode();
    this.setPatchRate(MS_PER_SECOND / BALANCE.net.patchesPerSecond);
    this.setSimulationInterval((deltaMs) => {
      const ticks = advance(this.loop, deltaMs / MS_PER_SECOND);
      for (let i = 0; i < ticks; i += 1) {
        this.tick();
      }
    }, MS_PER_SECOND / BALANCE.simulation.tickHz);
    writeWaiting(this.state);
  }

  override onJoin(client: Client): void {
    this.queues.set(client.sessionId, new InputQueue());
    const character = firstFreeCharacter(this.charactersExcept(client.sessionId)) ?? 0;
    this.members.set(client.sessionId, { character, order: this.nextOrder });
    this.nextOrder += 1;
    if (this.hostId === "") {
      this.hostId = client.sessionId;
    }
    this.publishLobby();
  }

  override onLeave(client: Client): void {
    this.queues.delete(client.sessionId);
    this.members.delete(client.sessionId);
    if (this.hostId === client.sessionId) {
      this.hostId = this.oldestMember() ?? "";
    }
    this.publishLobby();
    if (this.match !== null) {
      this.match = {
        ...this.match,
        players: this.match.players.map((p) =>
          p.id === client.sessionId ? { ...p, alive: false } : p,
        ),
      };
    }
  }

  private charactersExcept(id: string): number[] {
    return [...this.members].filter(([memberId]) => memberId !== id).map(([, m]) => m.character);
  }

  private oldestMember(): string | null {
    const ordered = [...this.members].sort((a, b) => a[1].order - b[1].order);
    return ordered[0]?.[0] ?? null;
  }

  private startRound(): void {
    const seed = Math.floor(Math.random() * SEED_RANGE);
    const ids = [...this.members]
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id]) => id)
      .slice(0, BALANCE.net.maxClientsPerRoom);
    this.match = applySeriesScore(createMatchState(seed, ids), this.series);
    this.finishedFor = 0;
    this.roundRecorded = false;
    this.publishMatch();
  }

  private tick(): void {
    if (this.match === null) {
      return;
    }

    const frame: Record<string, InputCommand> = {};
    for (const player of this.match.players) {
      const queue = this.queues.get(player.id);
      if (queue !== undefined) {
        frame[player.id] = queue.next();
      }
    }
    this.match = step(this.match, frame, TICK_SECONDS);

    if (this.match.phase === MatchPhase.Finished) {
      this.finishRound();
    }
    this.publishMatch();
  }

  private finishRound(): void {
    if (this.match === null) {
      return;
    }
    if (!this.roundRecorded) {
      this.series = recordRound(this.series, this.match.winnerId);
      this.match = applySeriesScore(this.match, this.series);
      this.roundRecorded = true;
    }
    this.finishedFor += TICK_SECONDS;
    const delay = this.series.finished
      ? BALANCE.time.seriesRestartDelay
      : BALANCE.time.roundRestartDelay;
    if (this.finishedFor >= delay) {
      this.nextRound();
    }
  }

  private nextRound(): void {
    const enoughPlayers = this.clients.length >= BALANCE.net.minPlayersToStart;
    if (!this.series.finished && enoughPlayers) {
      this.startRound();
      return;
    }
    this.match = null;
    this.series = NEW_SERIES;
    writeWaiting(this.state);
  }

  private publishLobby(): void {
    writeLobby(this.state, this.members, this.hostId);
  }

  private publishMatch(): void {
    if (this.match !== null) {
      writeMatch(this.state, this.match, this.series, (id) => this.queues.get(id)?.acknowledged ?? 0);
    }
  }
}
