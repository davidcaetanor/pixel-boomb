/**
 * Sprite de um personagem do elenco, interpolado entre dois estados. A direcao vem
 * de Player.facing; o deslocamento so indica se ha movimento. Parado, o personagem
 * respira; o vencedor da rodada comemora com pulinhos. Tudo em pixels inteiros.
 */
import Phaser from "phaser";
import { BALANCE, TILE_SIZE, type Player } from "@pixelboom/shared";
import {
  DIRECOES_FOLHA,
  FOLHA_PERSONAGEM,
  chaveDoPersonagem,
  type DirecaoFolha,
} from "../atlas/atlas-registry.js";

/** Acima do piso, pilares e marcadores de spawn. */
const PLAYER_DEPTH = 10;
/** Quadros por segundo da caminhada na velocidade inicial. */
const WALK_FRAME_RATE = 10;
/** Respiracao: alterna parado e "expirando" a cada RESPIRACAO_MS. */
const RESPIRACAO_MS = 700;
/** Deslocamento minimo entre estados, em celulas, para contar como andando. */
const MOVING_THRESHOLD = 1e-6;
/** Tempo parado antes de trocar para o frame de repouso. */
const IDLE_GRACE_SECONDS = 0.12;
/** Efeito de morte: tinge de vermelho e desaparece. */
const DEATH_TINT = 0xff4040;
const DEATH_FADE_MS = 450;
/** Pulinho de vitoria: altura em pixels e duracao de cada pulo. */
const PULO_ALTURA = 6;
const PULO_MS = 420;

function animKey(sheet: string, dir: DirecaoFolha): string {
  return `${sheet}-andar-${dir}`;
}

function linha(dir: DirecaoFolha): number {
  return DIRECOES_FOLHA.indexOf(dir) * FOLHA_PERSONAGEM.colunas;
}

function idleFrame(dir: DirecaoFolha): number {
  return linha(dir);
}

function breathFrame(dir: DirecaoFolha): number {
  return linha(dir) + FOLHA_PERSONAGEM.colunaRespiracao;
}

function registerAnimations(scene: Phaser.Scene, sheet: string): void {
  DIRECOES_FOLHA.forEach((dir) => {
    const key = animKey(sheet, dir);
    if (scene.anims.exists(key)) {
      return;
    }
    const start = linha(dir) + 1;
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

/** Altura do pulo no instante `ms`: arco parabolico, arredondado ao pixel. */
function alturaDoPulo(ms: number): number {
  const t = (ms % PULO_MS) / PULO_MS;
  return Math.round(PULO_ALTURA * 4 * t * (1 - t));
}

export class PlayerView {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly sheet: string;
  /** Defasagem da respiracao, para os jogadores nao respirarem juntos. */
  private readonly fase: number;
  private facing: DirecaoFolha = "south";
  private stillFor = IDLE_GRACE_SECONDS;
  private paradoMs = 0;
  private comemoraMs = 0;
  private dead = false;

  constructor(private readonly scene: Phaser.Scene, character: number) {
    this.sheet = chaveDoPersonagem(character);
    this.fase = (character * RESPIRACAO_MS) / 3;
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

  /** `comemorando`: venceu a rodada que acabou de terminar. */
  render(previous: Player, current: Player, alpha: number, dtSeconds: number, comemorando = false): void {
    const x = Phaser.Math.Linear(previous.x, current.x, alpha);
    const y = Phaser.Math.Linear(previous.y, current.y, alpha);
    this.comemoraMs = comemorando ? this.comemoraMs + dtSeconds * 1000 : 0;
    const pulo = comemorando ? alturaDoPulo(this.comemoraMs) : 0;
    this.sprite.setPosition(Math.round(x * TILE_SIZE), Math.round(y * TILE_SIZE) - pulo);

    if (!current.alive) {
      this.die();
      return;
    }

    this.facing = current.facing;

    if (Math.hypot(current.x - previous.x, current.y - previous.y) > MOVING_THRESHOLD) {
      this.stillFor = 0;
      this.paradoMs = 0;
      // A passada acompanha a velocidade: com bota, os pes nao deslizam no chao.
      this.sprite.anims.timeScale = current.speed / BALANCE.player.speedInitial;
      this.sprite.anims.play(animKey(this.sheet, this.facing), true);
      return;
    }

    this.stillFor += dtSeconds;
    if (this.stillFor < IDLE_GRACE_SECONDS) {
      return;
    }
    if (this.sprite.anims.isPlaying) {
      this.sprite.anims.stop();
    }
    this.paradoMs += dtSeconds * 1000;
    const expirando = Math.floor((this.paradoMs + this.fase) / RESPIRACAO_MS) % 2 === 1;
    this.sprite.setFrame(expirando && !comemorando ? breathFrame(this.facing) : idleFrame(this.facing));
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
