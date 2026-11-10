/**
 * Sala de espera sobreposta ao canvas: codigo e convite, escolha de personagem
 * e o botao de iniciar, ativo so para o anfitriao. Nao conhece rede nem Phaser.
 */
import { BALANCE, CHARACTER_COUNT } from "@pixelboom/shared";
import { FOLHA_PERSONAGEM, caminhoDaFolha, chaveDoPersonagem, ELENCO } from "../render/atlas/atlas-registry.js";
import { corCss, corDoSlot } from "../render/palette.js";

export interface RoomPanelActions {
  onPick(character: number): void;
  onStart(): void;
}

export interface RoomPanelView {
  readonly code: string;
  readonly localId: string;
  readonly hostId: string;
  /** Em ordem de entrada; a posicao define a cor do slot. */
  readonly members: readonly { readonly id: string; readonly character: number }[];
}

/** Escala da miniatura do personagem sobre o quadro de 48 px. */
const PREVIEW_SCALE = 2;
const COPIED_FEEDBACK_MS = 1500;

export class RoomPanel {
  private readonly root: HTMLElement;
  private readonly status: HTMLElement;
  private readonly start: HTMLButtonElement;
  private readonly copy: HTMLButtonElement;
  private readonly cards: HTMLButtonElement[] = [];
  private inviteUrl = "";

  constructor(actions: RoomPanelActions, host: HTMLElement = document.body) {
    this.root = document.createElement("div");
    this.root.className = "lobby room";

    const title = document.createElement("h1");
    title.textContent = "Sala";

    this.copy = document.createElement("button");
    this.copy.type = "button";
    this.copy.addEventListener("click", () => this.copyInvite());

    const grid = document.createElement("div");
    grid.className = "roster";
    for (let character = 0; character < CHARACTER_COUNT; character += 1) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "roster-card";
      card.title = ELENCO[character] ?? "";
      const preview = document.createElement("span");
      preview.className = "roster-preview";
      preview.style.backgroundImage = `url(${caminhoDaFolha(chaveDoPersonagem(character))})`;
      preview.style.width = `${FOLHA_PERSONAGEM.larguraFrame * PREVIEW_SCALE}px`;
      preview.style.height = `${FOLHA_PERSONAGEM.alturaFrame * PREVIEW_SCALE}px`;
      preview.style.backgroundSize = `${FOLHA_PERSONAGEM.larguraFrame * FOLHA_PERSONAGEM.colunas * PREVIEW_SCALE}px auto`;
      const label = document.createElement("span");
      label.className = "roster-label";
      card.append(preview, label);
      card.addEventListener("click", () => actions.onPick(character));
      this.cards.push(card);
      grid.append(card);
    }

    this.status = document.createElement("p");
    this.status.className = "room-status";

    this.start = document.createElement("button");
    this.start.type = "button";
    this.start.textContent = "Iniciar";
    this.start.className = "room-start";
    this.start.addEventListener("click", () => actions.onStart());

    this.root.append(title, this.copy, grid, this.status, this.start);
    host.append(this.root);
  }

  render(view: RoomPanelView): void {
    this.inviteUrl = `${window.location.origin}${window.location.pathname}?sala=${view.code}`;
    if (!this.copy.dataset["copied"]) {
      this.copy.textContent = `Codigo ${view.code}  |  copiar convite`;
    }

    const owners = new Map(view.members.map((m, slot) => [m.character, { id: m.id, slot }]));
    this.cards.forEach((card, character) => {
      const owner = owners.get(character);
      const mine = owner?.id === view.localId;
      card.disabled = owner !== undefined && !mine;
      card.classList.toggle("is-mine", mine);
      card.style.borderColor = owner === undefined ? "" : corCss(corDoSlot(owner.slot));
      const label = card.querySelector(".roster-label");
      if (label !== null) {
        label.textContent = owner === undefined ? "livre" : mine ? "voce" : `J${owner.slot + 1}`;
      }
    });

    const isHost = view.localId === view.hostId;
    const count = view.members.length;
    const needed = BALANCE.net.minPlayersToStart;
    this.start.hidden = !isHost;
    this.start.disabled = count < needed;
    const players = `${count}/${BALANCE.net.maxClientsPerRoom} jogadores`;
    if (isHost) {
      this.status.textContent = count < needed ? `${players}, minimo ${needed} para iniciar` : players;
    } else {
      this.status.textContent = `${players}, aguardando o anfitriao iniciar`;
    }
  }

  dispose(): void {
    this.root.remove();
  }

  private copyInvite(): void {
    void navigator.clipboard?.writeText(this.inviteUrl).then(() => {
      this.copy.dataset["copied"] = "1";
      this.copy.textContent = "Convite copiado";
      window.setTimeout(() => delete this.copy.dataset["copied"], COPIED_FEEDBACK_MS);
    });
  }
}
