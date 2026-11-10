/**
 * View passiva do jogador. Interpola entre o tick anterior e o atual; a
 * direcao vem de Player.facing, e o deslocamento so diz se esta andando.
 *
 * So 4 direcoes, porque o movimento e de 4 direcoes. Parado por mais que
 * IDLE_GRACE_SECONDS, mostra o frame de repouso da ultima direcao. A tolerancia
 * evita piscar o repouso entre soltar uma tecla e apertar a outra.
 */
import Phaser from "phaser";
import { TILE_SIZE, type Player } from "@pixelboom/shared";
import {
  DIRECOES_FOLHA,
  FOLHA_JOGADOR,
  type DirecaoFolha,
} from "../atlas/atlas-registry.js";

/** Acima do piso, pilares e marcadores de spawn. */
const PLAYER_DEPTH = 10;
/** Quadros por segundo da caminhada. */
const WALK_FRAME_RATE = 10;
/** Deslocamento minimo entre ticks, em celulas, para contar como andando. */
const MOVING_THRESHOLD = 1e-6;
/** Tempo parado antes de trocar para o frame de repouso. */
const IDLE_GRACE_SECONDS = 0.12;

function animKey(dir: DirecaoFolha): string {
  return `${FOLHA_JOGADOR.chave}-andar-${dir}`;
}

function idleFrame(dir: DirecaoFolha): number {
  return DIRECOES_FOLHA.indexOf(dir) * FOLHA_JOGADOR.colunas;
}

export function registerPlayerAnimations(scene: Phaser.Scene): void {
  DIRECOES_FOLHA.forEach((dir, row) => {
    const key = animKey(dir);
    if (scene.anims.exists(key)) {
      return;
    }
    const start = row * FOLHA_JOGADOR.colunas + 1;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(FOLHA_JOGADOR.chave, {
        start,
        end: start + FOLHA_JOGADOR.framesCaminhada - 1,
      }),
      frameRate: WALK_FRAME_RATE,
      repeat: -1,
    });
  });
}

export class PlayerView {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private facing: DirecaoFolha = "south";
  private stillFor = IDLE_GRACE_SECONDS;

  constructor(scene: Phaser.Scene) {
    registerPlayerAnimations(scene);
    this.sprite = scene.add
      .sprite(0, 0, FOLHA_JOGADOR.chave, idleFrame(this.facing))
      .setDepth(PLAYER_DEPTH);
  }

  render(previous: Player, current: Player, alpha: number, dtSeconds: number): void {
    const x = Phaser.Math.Linear(previous.x, current.x, alpha);
    const y = Phaser.Math.Linear(previous.y, current.y, alpha);
    this.sprite.setPosition(x * TILE_SIZE, y * TILE_SIZE);
    this.sprite.setVisible(current.alive);

    const dx = current.x - previous.x;
    const dy = current.y - previous.y;

    if (Math.hypot(dx, dy) > MOVING_THRESHOLD) {
      this.stillFor = 0;
      this.facing = current.facing;
      this.sprite.anims.play(animKey(this.facing), true);
      return;
    }

    this.stillFor += dtSeconds;
    if (this.stillFor >= IDLE_GRACE_SECONDS && this.sprite.anims.isPlaying) {
      this.sprite.anims.stop();
      this.sprite.setFrame(idleFrame(this.facing));
    }
  }
}
