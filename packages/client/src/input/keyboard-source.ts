/**
 * Setas e WASD viram InputCommand.
 *
 * Uma direcao por vez, e a ultima tecla apertada ganha: segurar "direita" e
 * tocar "baixo" vira para baixo; soltar "baixo" volta para a direita. E o
 * comportamento classico do genero e o que deixa entrar em corredor sem
 * brigar com a diagonal.
 *
 * So le teclado. Nao sabe nada de regra nem de posicao.
 */
import type { InputCommand } from "@pixelboom/shared";
import { IDLE_INPUT } from "@pixelboom/shared";

type Direction = "up" | "down" | "left" | "right";

const KEY_TO_DIRECTION: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const DIRECTION_TO_COMMAND: Readonly<Record<Direction, InputCommand>> = {
  up: { moveX: 0, moveY: -1 },
  down: { moveX: 0, moveY: 1 },
  left: { moveX: -1, moveY: 0 },
  right: { moveX: 1, moveY: 0 },
};

export class KeyboardSource {
  /** Direcoes seguradas, da mais antiga para a mais recente. */
  private held: Direction[] = [];

  private readonly onDown = (event: KeyboardEvent): void => {
    const dir = KEY_TO_DIRECTION[event.code];
    if (dir === undefined) {
      return;
    }
    event.preventDefault();
    if (!this.held.includes(dir)) {
      this.held.push(dir);
    }
  };

  private readonly onUp = (event: KeyboardEvent): void => {
    const dir = KEY_TO_DIRECTION[event.code];
    if (dir !== undefined) {
      this.held = this.held.filter((d) => d !== dir);
    }
  };

  /** Ao perder o foco o keyup nunca chega; solta tudo para nao andar sozinho. */
  private readonly onBlur = (): void => {
    this.held = [];
  };

  constructor(private readonly target: Window = window) {
    target.addEventListener("keydown", this.onDown);
    target.addEventListener("keyup", this.onUp);
    target.addEventListener("blur", this.onBlur);
  }

  read(): InputCommand {
    const last = this.held[this.held.length - 1];
    return last === undefined ? IDLE_INPUT : DIRECTION_TO_COMMAND[last];
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.onDown);
    this.target.removeEventListener("keyup", this.onUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.held = [];
  }
}
