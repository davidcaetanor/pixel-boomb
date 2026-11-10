/**
 * Partida online. O proprio jogador e previsto localmente a cada tick; os
 * adversarios sao desenhados com atraso fixo, interpolados entre estados
 * recebidos. Cada rodada nova reinicia a cena para redesenhar a arena,
 * mantendo a conexao e a numeracao das entradas.
 */
import Phaser from "phaser";
import {
  BALANCE,
  IDLE_INPUT,
  MatchPhase,
  advance,
  createFixedLoop,
  interpolationAlpha,
  type FixedLoopState,
  type InputCommand,
  type MatchState,
  type Player,
} from "@pixelboom/shared";
import type { Room } from "@colyseus/sdk";
import { KeyboardSource } from "../../input/keyboard-source.js";
import { SnapshotBuffer } from "../../net/interpolation.js";
import { predictionFor, type LocalPrediction } from "../../net/prediction.js";
import { activeRoom } from "../../net/room-client.js";
import { readSnapshot, type MatchSnapshot, type RemoteState } from "../../net/snapshot.js";
import { onlineBanner, roundLabel } from "../hud/messages.js";
import { Scoreboard } from "../hud/scoreboard.js";
import { SelfMarker } from "../hud/self-marker.js";
import { TimerHud } from "../hud/timer.js";
import { ArenaView } from "../views/arena-view.js";
import { BombView } from "../views/bomb-view.js";
import { ExplosionView } from "../views/explosion-view.js";
import { PlayerView } from "../views/player-view.js";
import { PowerUpView } from "../views/powerup-view.js";

const MS_PER_SECOND = 1000;

interface MatchViews {
  readonly arena: ArenaView;
  readonly bombs: BombView;
  readonly powerUps: PowerUpView;
  readonly explosions: ExplosionView;
  readonly players: ReadonlyMap<string, PlayerView>;
  readonly selfMarker: SelfMarker | null;
}

function isMovingPhase(state: MatchState): boolean {
  return state.phase === MatchPhase.Playing || state.phase === MatchPhase.SuddenDeath;
}

export class OnlineScene extends Phaser.Scene {
  private room!: Room;
  private prediction!: LocalPrediction;
  private keyboard!: KeyboardSource;
  private timer!: TimerHud;
  private scoreboard!: Scoreboard;
  private status!: Phaser.GameObjects.Text;
  private readonly buffer = new SnapshotBuffer();
  private readonly loop: FixedLoopState = createFixedLoop();
  private readonly drawnOthers = new Map<string, Player>();
  private latest: MatchSnapshot | null = null;
  private waiting = 0;
  private views: MatchViews | null = null;

  constructor() {
    super({ key: "online" });
  }

  create(): void {
    const room = activeRoom();
    if (room === null) {
      this.scene.start("lobby");
      return;
    }
    this.room = room;
    this.prediction = predictionFor(room);
    this.prediction.forgetPosition();
    this.buffer.clear();
    this.drawnOthers.clear();
    this.latest = null;
    this.views = null;
    this.loop.accumulator = 0;

    this.keyboard = new KeyboardSource();
    this.timer = new TimerHud(this);
    this.scoreboard = new Scoreboard(this);
    this.status = this.add
      .text(8, 4, `SALA ${room.roomId}`, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f4ecd8",
        stroke: "#14121c",
        strokeThickness: 3,
      })
      .setDepth(200);

    const onState = (state: unknown): void => this.receive(state as RemoteState);
    room.onStateChange(onState);
    onState(room.state);

    // Com a aba oculta o update para; a intencao parada e enviada na hora.
    const onHidden = (): void => {
      if (document.hidden) {
        this.send(IDLE_INPUT);
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      room.onStateChange.remove(onState);
      document.removeEventListener("visibilitychange", onHidden);
      this.keyboard.dispose();
    });
  }

  private receive(remote: RemoteState): void {
    const snapshot = readSnapshot(remote);
    if (snapshot.kind === "waiting") {
      this.waiting = snapshot.connected;
      if (this.latest !== null) {
        this.scene.restart();
      }
      return;
    }
    if (this.latest !== null && snapshot.state.tick < this.latest.state.tick) {
      this.scene.restart();
      return;
    }

    this.latest = snapshot;
    this.buffer.push(performance.now(), snapshot.state.players);
    const self = snapshot.state.players.find((p) => p.id === this.room.sessionId);
    if (self !== undefined) {
      const world = snapshot.state;
      this.prediction.reconcile(world, self, snapshot.acks.get(self.id) ?? 0, isMovingPhase(world));
    }
  }

  private send(input: InputCommand): void {
    const world = this.latest?.state;
    if (world === undefined) {
      return;
    }
    const entry = this.prediction.apply(world, input, isMovingPhase(world));
    this.room.send("input", { seq: entry.seq, ...entry.input });
  }

  override update(time: number, deltaMs: number): void {
    if (this.room === undefined) {
      return;
    }
    if (activeRoom() !== this.room) {
      this.status.setText("desconectado, recarregue a pagina");
      return;
    }
    const snapshot = this.latest;
    if (snapshot === null) {
      this.timer.renderWaiting(this.waiting, BALANCE.net.minPlayersToStart);
      return;
    }

    const ticks = advance(this.loop, deltaMs / MS_PER_SECOND);
    for (let i = 0; i < ticks; i += 1) {
      this.send(this.keyboard.read());
    }
    this.draw(snapshot, time, deltaMs / MS_PER_SECOND);
  }

  private draw(snapshot: MatchSnapshot, time: number, dt: number): void {
    const { state, series } = snapshot;
    const localId = this.room.sessionId;
    const views = this.views ?? this.createViews(state, localId);

    views.arena.render(state.grid, state.phase);
    views.powerUps.render(state.powerUps);
    views.bombs.render(state.bombs);
    views.explosions.render(state.explosions);

    const now = performance.now();
    for (const player of state.players) {
      const view = views.players.get(player.id);
      if (view === undefined) {
        continue;
      }
      if (player.id === localId) {
        const frames = this.prediction.frames;
        const current = frames === null ? player : { ...frames.current, alive: player.alive };
        view.render(frames?.previous ?? player, current, interpolationAlpha(this.loop), dt);
        continue;
      }
      const sampled = this.buffer.sample(player.id, now) ?? player;
      view.render(this.drawnOthers.get(player.id) ?? sampled, sampled, 1, dt);
      this.drawnOthers.set(player.id, sampled);
    }

    const selfView = views.players.get(localId);
    if (views.selfMarker !== null && selfView !== undefined) {
      const { x, y } = selfView.position;
      views.selfMarker.render(x, y, state.phase, state.elapsed, time, !selfView.isDead);
    }

    this.timer.render(state, `SALA ${this.room.roomId}  ${roundLabel(series)}`, onlineBanner(state, series, localId));
    this.status.setText("");
    this.scoreboard.render(state.players, localId);
  }

  private createViews(state: MatchState, localId: string): MatchViews {
    const self = state.players.find((p) => p.id === localId);
    this.views = {
      arena: new ArenaView(this, state.grid, state.players),
      bombs: new BombView(this),
      powerUps: new PowerUpView(this),
      explosions: new ExplosionView(this),
      players: new Map(state.players.map((p) => [p.id, new PlayerView(this, p.slot)])),
      selfMarker: self === undefined ? null : new SelfMarker(this, self.slot),
    };
    return this.views;
  }
}
