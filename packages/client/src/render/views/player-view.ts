/**
 * Sprite de um personagem do elenco, interpolado entre dois estados. A direcao vem
 * de Player.facing; o deslocamento so indica se ha movimento. O quadro parado
 * espera IDLE_GRACE_SECONDS para nao piscar na troca de tecla.
 */
import Phaser from "phaser";
import { TILE_SIZE, type Player } from "@pixelboom/shared";
import {
  DIRECOES_FOLHA,
  FOLHA_PERSONAGEM,
  chaveDoPersonagem,
  type DirecaoFolha,
} from "../atlas/atlas-registry.js";

/** Acima do piso, pilares e marcadores de spawn. */
const PLAYER_DEPTH = 10;
/** Quadros por segundo da caminhada. */
const WALK_FRAME_RATE = 10;
/** Deslocamento minimo entre estados, em celulas, para contar como andando. */
const MOVING_THRESHOLD = 1e-6;
/** Tempo parado antes de trocar para o frame de repouso. */
const IDLE_GRACE_SECONDS = 0.12;
/** Efeito de morte: tinge de vermelho e desaparece. */
const DEATH_TINT = 0xff4040;
const DEATH_FADE_MS = 450;

function animKey(sheet: string, dir: DirecaoFolha): string {
  return `${sheet}-andar-${dir}`;
}

function idleFrame(dir: DirecaoFolha): number {
  return DIRECOES_FOLHA.indexOf(dir) * FOLHA_PERSONAGEM.colunas;
}

function registerAnimations(scene: Phaser.Scene, sheet: string): void {
  DIRECOES_FOLHA.forEach((dir, row) => {
    const key = animKey(sheet, dir);
    if (scene.anims.exists(key)) {
      return;
    }
    const start = row * FOLHA_PERSONAGEM.colunas + 1;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(sheet, {
        start,
        end: start + FOLHA_PERSONAGEM.framesCaminhada - 1,
      }),
      frameRate: WALK_FRAME_RATE,
      repeat: -1,
    });
  });
}

export class PlayerView {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly sheet: string;
  private facing: DirecaoFolha = "south";
  private stillFor = IDLE_GRACE_SECONDS;
  private dead = false;

  constructor(private readonly scene: Phaser.Scene, character: number) {
    this.sheet = chaveDoPersonagem(character);
    registerAnimations(scene, this.sheet);
    this.sprite = scene.add.sprite(0, 0, this.sheet, idleFrame(this.facing)).setDepth(PLAYER_DEPTH);
  }

  /** Posicao desenhada, em pixels. */
  get position(): { readonly x: number; readonly y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  get isDead(): boolean {
    return this.dead;
  }

  render(previous: Player, current: Player, alpha: number, dtSeconds: number): void {
    const x = Phaser.Math.Linear(previous.x, current.x, alpha);
    const y = Phaser.Math.Linear(previous.y, current.y, alpha);
    this.sprite.setPosition(x * TILE_SIZE, y * TILE_SIZE);

    if (!current.alive) {
      this.die();
      return;
    }

    if (Math.hypot(current.x - previous.x, current.y - previous.y) > MOVING_THRESHOLD) {
      this.stillFor = 0;
      this.facing = current.facing;
      this.sprite.anims.play(animKey(this.sheet, this.facing), true);
      return;
    }

    this.stillFor += dtSeconds;
    if (this.stillFor >= IDLE_GRACE_SECONDS && this.sprite.anims.isPlaying) {
      this.sprite.anims.stop();
      this.sprite.setFrame(idleFrame(this.facing));
    }
  }

  private die(): void {
    if (this.dead) {
      return;
    }
    this.dead = true;
    this.sprite.anims.stop();
    this.sprite.setFrame(idleFrame(this.facing)).setTint(DEATH_TINT);
    this.scene.tweens.add({ targets: this.sprite, alpha: 0, duration: DEATH_FADE_MS });
  }
}
