/**
 * Partida online, sem predicao (E4): o servidor e a autoridade, o cliente so
 * manda intencao e desenha o ultimo estado recebido. Vai parecer travado com
 * latencia alta, e isso e esperado ate a E5.
 *
 * A cada rodada nova a cena reinicia para redesenhar a arena; a conexao com a
 * sala continua a mesma.
 */
import Phaser from "phaser";
import { BALANCE, type InputCommand, type MatchState } from "@pixelboom/shared";
import type { Room } from "@colyseus/sdk";
import { KeyboardSource } from "../../input/keyboard-source.js";
import { joinMatch } from "../../net/room-client.js";
import { readSnapshot, type RemoteState, type Snapshot } from "../../net/snapshot.js";
import { TimerHud } from "../hud/timer.js";
import { ArenaView } from "../views/arena-view.js";
import { BombView } from "../views/bomb-view.js";
import { ExplosionView } from "../views/explosion-view.js";
import { PlayerView } from "../views/player-view.js";
import { PowerUpView } from "../views/powerup-view.js";

const MS_PER_SECOND = 1000;
/** Sem predicao, desenha o estado recebido sem interpolar entre ticks. */
const NO_INTERPOLATION = 1;

function sameIntent(a: InputCommand | null, b: InputCommand): boolean {
  return a !== null && a.moveX === b.moveX && a.moveY === b.moveY && a.prefer === b.prefer;
}

export class OnlineScene extends Phaser.Scene {
  private room: Room | null = null;
  private keyboard!: KeyboardSource;
  private hud!: TimerHud;
  private status!: Phaser.GameObjects.Text;
  private views: {
    arena: ArenaView;
    bombs: BombView;
    powerUps: PowerUpView;
    explosions: ExplosionView;
    players: Map<string, PlayerView>;
  } | null = null;
  private previous: MatchState | null = null;
  private lastTick = -1;
  private lastSent: InputCommand | null = null;

  constructor() {
    super({ key: "online" });
  }

  create(): void {
    this.views = null;
    this.previous = null;
    this.lastTick = -1;
    this.lastSent = null;
    this.keyboard = new KeyboardSource();
    this.hud = new TimerHud(this, "");
    this.status = this.add
      .text(8, 4, "conectando...", { fontFamily: "monospace", fontSize: "12px", color: "#f4ecd8" })
      .setDepth(200);

    joinMatch()
      .then((room) => {
        this.room = room;
        this.hud = new TimerHud(this, room.sessionId);
        this.status.setText("");
        room.onLeave(() => this.status.setText("desconectado, recarregue a pagina"));
      })
      .catch(() => this.status.setText("sem conexao com o servidor"));

    // Aba escondida: o Phaser para de atualizar, entao avisamos o servidor
    // agora para o jogador nao seguir andando sozinho.
    const onHidden = (): void => {
      if (document.hidden && this.room !== null) {
        this.room.send("input", { moveX: 0, moveY: 0 });
        this.lastSent = null;
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener("visibilitychange", onHidden);
      this.keyboard.dispose();
    });
  }

  override update(_time: number, deltaMs: number): void {
    const room = this.room;
    if (room === null) {
      return;
    }
    this.sendInput(room);

    const snapshot: Snapshot = readSnapshot(room.state as RemoteState);
    if (snapshot.kind === "waiting") {
      this.hud.renderWaiting(snapshot.connected, BALANCE.net.minPlayersToStart);
      if (this.views !== null) {
        this.scene.restart();
      }
      return;
    }

    const state = snapshot.state;
    if (state.tick < this.lastTick) {
      // Rodada nova: arena diferente, redesenha do zero.
      this.scene.restart();
      return;
    }
    this.lastTick = state.tick;
    this.draw(state, room.sessionId, deltaMs / MS_PER_SECOND);
  }

  private sendInput(room: Room): void {
    const command = this.keyboard.read();
    if (command.bomb === true || !sameIntent(this.lastSent, command)) {
      room.send("input", command);
      this.lastSent = command;
    }
  }

  private draw(state: MatchState, localId: string, dt: number): void {
    if (this.views === null) {
      this.views = {
        arena: new ArenaView(this, state.grid, state.players),
        bombs: new BombView(this),
        powerUps: new PowerUpView(this),
        explosions: new ExplosionView(this),
        players: new Map(state.players.map((p) => [p.id, new PlayerView(this)])),
      };
    }
    const views = this.views;
    views.arena.render(state.grid, state.phase);
    views.powerUps.render(state.powerUps);
    views.bombs.render(state.bombs);
    views.explosions.render(state.explosions);

    const before = new Map((this.previous?.players ?? []).map((p) => [p.id, p]));
    for (const player of state.players) {
      views.players.get(player.id)?.render(before.get(player.id) ?? player, player, NO_INTERPOLATION, dt);
    }
    this.previous = state;

    if (state.players.some((p) => p.id === localId)) {
      this.hud.render(state);
    } else {
      this.hud.renderSpectator(state);
    }
  }
}
