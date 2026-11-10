/**
 * Partida offline de um jogador. O update do Phaser segue a taxa do monitor;
 * a simulacao avanca em ticks fixos pelo acumulador e o desenho interpola
 * entre eles. Enter, ao fim da rodada, inicia outra com a semente seguinte.
 */
import Phaser from "phaser";
import {
  MatchPhase,
  TICK_SECONDS,
  advance,
  createFixedLoop,
  createMatchState,
  interpolationAlpha,
  step,
  type FixedLoopState,
  type MatchState,
} from "@pixelboom/shared";
import { KeyboardSource } from "../../input/keyboard-source.js";
import { TimerHud } from "../hud/timer.js";
import { ArenaView } from "../views/arena-view.js";
import { BombView } from "../views/bomb-view.js";
import { ExplosionView } from "../views/explosion-view.js";
import { PlayerView } from "../views/player-view.js";
import { PowerUpView } from "../views/powerup-view.js";

/** Id do jogador na partida offline. */
const LOCAL_PLAYER_ID = "local";
/** Faixa de sementes de 31 bits, a mesma que o RNG de shared aceita. */
const SEED_RANGE = 2 ** 31;
/** Chave no registry do Phaser que guarda a semente da proxima rodada. */
const SEED_KEY = "semente-local";
const MS_PER_SECOND = 1000;

export class MatchScene extends Phaser.Scene {
  private state!: MatchState;
  private previous!: MatchState;
  private loop!: FixedLoopState;
  private keyboard!: KeyboardSource;
  private arenaView!: ArenaView;
  private bombView!: BombView;
  private explosionView!: ExplosionView;
  private playerView!: PlayerView;
  private powerUpView!: PowerUpView;
  private hud!: TimerHud;

  constructor() {
    super({ key: "match" });
  }

  create(): void {
    const semente =
      (this.registry.get(SEED_KEY) as number | undefined) ?? Math.floor(Math.random() * SEED_RANGE);
    this.registry.set(SEED_KEY, (semente + 1) % SEED_RANGE);
    this.state = createMatchState(semente, [LOCAL_PLAYER_ID]);
    this.previous = this.state;
    this.loop = createFixedLoop();
    this.keyboard = new KeyboardSource();

    this.arenaView = new ArenaView(this, this.state.grid, this.state.players);
    this.bombView = new BombView(this);
    this.powerUpView = new PowerUpView(this);
    this.explosionView = new ExplosionView(this);
    this.playerView = new PlayerView(this);
    this.hud = new TimerHud(this, LOCAL_PLAYER_ID);

    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this.state.phase === MatchPhase.Finished) {
        this.scene.restart();
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboard.dispose());
  }

  override update(_time: number, deltaMs: number): void {
    const ticks = advance(this.loop, deltaMs / MS_PER_SECOND);
    for (let i = 0; i < ticks; i += 1) {
      this.previous = this.state;
      this.state = step(
        this.state,
        { [LOCAL_PLAYER_ID]: this.keyboard.read() },
        TICK_SECONDS,
      );
    }

    this.arenaView.render(this.state.grid, this.state.phase);
    this.powerUpView.render(this.state.powerUps);
    this.bombView.render(this.state.bombs);
    this.explosionView.render(this.state.explosions);

    const atual = this.state.players[0];
    const anterior = this.previous.players[0] ?? atual;
    if (atual !== undefined && anterior !== undefined) {
      const alpha = interpolationAlpha(this.loop);
      this.playerView.render(anterior, atual, alpha, deltaMs / MS_PER_SECOND);
    }
    this.hud.render(this.state);
  }
}
