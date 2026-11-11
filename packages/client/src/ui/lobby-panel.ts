/** Painel HTML do lobby, sobreposto ao canvas. Nao conhece rede nem Phaser. */
import { ROOM_CODE_LENGTH } from "@pixelboom/shared";

export interface LobbyActions {
  onCreate(): void;
  onJoin(code: string): void;
}

export class LobbyPanel {
  private readonly root: HTMLElement;
  private readonly error: HTMLElement;
  private readonly buttons: HTMLButtonElement[];
  private readonly input: HTMLInputElement;

  constructor(actions: LobbyActions, host: HTMLElement = document.body) {
    this.root = document.createElement("div");
    this.root.className = "lobby";

    const title = document.createElement("h1");
    const logo = document.createElement("img");
    logo.className = "ui-logo";
    logo.src = "/ui-logo.png";
    logo.alt = "PixelBoom";
    title.append(logo);

    const create = document.createElement("button");
    create.type = "button";
    create.textContent = "Criar sala";
    create.addEventListener("click", () => actions.onCreate());

    const form = document.createElement("form");
    this.input = document.createElement("input");
    this.input.placeholder = "Codigo";
    this.input.maxLength = ROOM_CODE_LENGTH;
    this.input.autocomplete = "off";
    this.input.spellcheck = false;
    const join = document.createElement("button");
    join.type = "submit";
    join.textContent = "Entrar";
    form.append(this.input, join);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      actions.onJoin(this.input.value);
    });

    this.error = document.createElement("p");
    this.error.className = "lobby-error";

    this.buttons = [create, join];
    const box = document.createElement("div");
    box.className = "ui-panel";
    box.append(title, create, form, this.error);
    this.root.append(box);
    host.append(this.root);
  }

  showError(message: string): void {
    this.error.textContent = message;
  }

  setBusy(busy: boolean): void {
    for (const button of this.buttons) {
      button.disabled = busy;
    }
    this.input.disabled = busy;
    if (busy) {
      this.error.textContent = "";
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
