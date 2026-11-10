/**
 * Setas e WASD viram InputCommand.
 *
 * Envia a direcao mais recente de cada eixo e qual eixo foi apertado por
 * ultimo. Segurar "direita" e apertar "baixo" pede baixo com prioridade e
 * direita como alternativa; a simulacao decide qual cabe.
 *
 * Bomba (Espaco) e enviada so uma vez por aperto, no proximo read().
 */
import type { AxisIntent, InputCommand } from "@pixelboom/shared";
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

const DIRECTION_AXIS: Readonly<Record<Direction, { axis: "x" | "y"; sign: AxisIntent }>> = {
  up: { axis: "y", sign: -1 },
  down: { axis: "y", sign: 1 },
  left: { axis: "x", sign: -1 },
  right: { axis: "x", sign: 1 },
};

const BOMB_KEYS: ReadonlySet<string> = new Set(["Space"]);

export class KeyboardSource {
  /** Direcoes seguradas, da mais antiga para a mais recente. */
  private held: Direction[] = [];
  private bombPending = false;

  private readonly onDown = (event: KeyboardEvent): void => {
    if (BOMB_KEYS.has(event.code)) {
      event.preventDefault();
      if (!event.repeat) {
        this.bombPending = true;
      }
      return;
    }
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
    this.bombPending = false;
  };

  /** Aba em segundo plano conta como perder o foco. */
  private readonly onVisibility = (): void => {
    if (document.hidden) {
      this.onBlur();
    }
  };

  constructor(private readonly target: Window = window) {
    target.addEventListener("keydown", this.onDown);
    target.addEventListener("keyup", this.onUp);
    target.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  read(): InputCommand {
    const bomb = this.bombPending;
    this.bombPending = false;
    const last = this.held[this.held.length - 1];
    if (last === undefined) {
      return bomb ? { ...IDLE_INPUT, bomb } : IDLE_INPUT;
    }
    let moveX: AxisIntent = 0;
    let moveY: AxisIntent = 0;
    for (const dir of this.held) {
      const { axis, sign } = DIRECTION_AXIS[dir];
      if (axis === "x") {
        moveX = sign;
      } else {
        moveY = sign;
      }
    }
    return { moveX, moveY, prefer: DIRECTION_AXIS[last].axis, bomb };
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.onDown);
    this.target.removeEventListener("keyup", this.onUp);
    this.target.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.held = [];
  }
}
