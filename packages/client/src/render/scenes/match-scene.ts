/**
 * Partida local: arena, bombas, chamas e jogador no loop de passo fixo.
 *
 * O update do Phaser roda na taxa do monitor; a simulacao so avanca em ticks
 * de 30 Hz pelo acumulador de shared, e o desenho interpola entre ticks.
 */
import Phaser from "phaser";
import {
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
import { ArenaView } from "../views/arena-view.js";
import { BombView } from "../views/bomb-view.js";
import { ExplosionView } from "../views/explosion-view.js";
import { PlayerView } from "../views/player-view.js";

/** Id do jogador local enquanto nao ha sala (E4). */
const LOCAL_PLAYER_ID = "local";
/** Semente fixa da partida local; a sala sorteia a sua no servidor. */
const LOCAL_SEED = 1;
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

  constructor() {
    super({ key: "match" });
  }

  create(): void {
    this.state = createMatchState(LOCAL_SEED, [LOCAL_PLAYER_ID]);
    this.previous = this.state;
    this.loop = createFixedLoop();
    this.keyboard = new KeyboardSource();

    this.arenaView = new ArenaView(this, this.state.grid);
    this.bombView = new BombView(this);
    this.explosionView = new ExplosionView(this);
    this.playerView = new PlayerView(this);

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

    this.arenaView.render(this.state.grid);
    this.bombView.render(this.state.bombs);
    this.explosionView.render(this.state.explosions);

    const atual = this.state.players[0];
    const anterior = this.previous.players[0] ?? atual;
    if (atual !== undefined && anterior !== undefined) {
      const alpha = interpolationAlpha(this.loop);
      this.playerView.render(anterior, atual, alpha, deltaMs / MS_PER_SECOND);
    }
  }
}
