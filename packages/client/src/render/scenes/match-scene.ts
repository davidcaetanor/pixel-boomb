/**
 * Partida local: arena estatica e jogador andando no loop de passo fixo.
 *
 * O update do Phaser roda na taxa do monitor; a simulacao so avanca em ticks
 * de 30 Hz pelo acumulador de shared, e o desenho interpola entre ticks.
 * Caixas entram com a geracao de mapa em shared/rules (E2).
 */
import Phaser from "phaser";
import {
  ARENA_COLS,
  ARENA_ROWS,
  SPAWN_POINTS,
  TICK_SECONDS,
  TILE_SIZE,
  advance,
  createFixedLoop,
  createMatchState,
  interpolationAlpha,
  isBorder,
  isPillar,
  step,
  type FixedLoopState,
  type MatchState,
} from "@pixelboom/shared";
import { KeyboardSource } from "../../input/keyboard-source.js";
import { TEXTURA } from "../atlas/atlas-registry.js";
import { PlayerView } from "../views/player-view.js";

/** Id do jogador local enquanto nao ha sala (E4). */
const LOCAL_PLAYER_ID = "local";
/** Semente fixa da partida local; a sala sorteia a sua no servidor. */
const LOCAL_SEED = 1;
const MS_PER_SECOND = 1000;

/** Cor de cada slot, usada para tingir o marcador de spawn. */
const CORES_JOGADOR = [
  0xe85d5d, 0x5da9e8, 0x6fcf63, 0xe8d15d,
  0xb46fe8, 0xe8945d, 0x5de8c9, 0xe85db4,
];

export class MatchScene extends Phaser.Scene {
  private state!: MatchState;
  private previous!: MatchState;
  private loop!: FixedLoopState;
  private keyboard!: KeyboardSource;
  private playerView!: PlayerView;

  constructor() {
    super({ key: "match" });
  }

  create(): void {
    this.desenhaPiso();
    this.desenhaParedes();
    this.desenhaMarcadoresDeSpawn();

    this.state = createMatchState(LOCAL_SEED, [LOCAL_PLAYER_ID]);
    this.previous = this.state;
    this.loop = createFixedLoop();
    this.keyboard = new KeyboardSource();
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

    const alpha = interpolationAlpha(this.loop);
    const atual = this.state.players[0];
    const anterior = this.previous.players[0] ?? atual;
    if (atual !== undefined && anterior !== undefined) {
      this.playerView.render(anterior, atual, alpha, deltaMs / MS_PER_SECOND);
    }
  }

  private desenhaPiso(): void {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        this.coloca(TEXTURA.piso, x, y);
      }
    }
  }

  private desenhaParedes(): void {
    for (let y = 0; y < ARENA_ROWS; y += 1) {
      for (let x = 0; x < ARENA_COLS; x += 1) {
        if (isBorder(x, y)) {
          // Arvore grande no corpo da borda, pequena nos cantos, para a
          // silhueta do perimetro nao ficar repetitiva.
          const canto =
            (x === 0 || x === ARENA_COLS - 1) &&
            (y === 0 || y === ARENA_ROWS - 1);
          this.coloca(canto ? TEXTURA.arvorePequena : TEXTURA.arvore, x, y);
        } else if (isPillar(x, y)) {
          this.coloca(TEXTURA.pilar, x, y);
        }
      }
    }
  }

  private desenhaMarcadoresDeSpawn(): void {
    // Fixos ate existir a fase de contagem regressiva (E3).
    SPAWN_POINTS.forEach((spawn, slot) => {
      const marcador = this.coloca(TEXTURA.spawn, spawn.x, spawn.y);
      marcador.setTint(CORES_JOGADOR[slot] ?? 0xffffff);
    });
  }

  private coloca(
    textura: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Image {
    return this.add
      .image(x * TILE_SIZE, y * TILE_SIZE, textura)
      .setOrigin(0, 0);
  }
}
