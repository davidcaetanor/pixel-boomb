/**
 * Entrada na sala: cria uma nova ou entra por codigo. Com `?sala=CODIGO` na
 * URL entra direto. Ao conectar, o codigo vai para a URL, que vira o link de
 * convite, e a partida abre.
 */
import Phaser from "phaser";
import { parseRoomCode } from "@pixelboom/shared";
import { createRoom, joinRoom } from "../../net/room-client.js";
import { LobbyPanel } from "../../ui/lobby-panel.js";

const ROOM_PARAM = "sala";

export class LobbyScene extends Phaser.Scene {
  private panel: LobbyPanel | null = null;

  constructor() {
    super({ key: "lobby" });
  }

  create(): void {
    this.panel = new LobbyPanel({
      onCreate: () => this.connect(createRoom()),
      onJoin: (raw) => {
        const code = parseRoomCode(raw);
        if (code === null) {
          this.panel?.showError("Codigo invalido");
          return;
        }
        this.connect(joinRoom(code));
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.panel?.dispose());

    const fromUrl = parseRoomCode(new URLSearchParams(window.location.search).get(ROOM_PARAM) ?? "");
    if (fromUrl !== null) {
      this.connect(joinRoom(fromUrl));
    }
  }

  private connect(joining: Promise<{ roomId: string }>): void {
    this.panel?.setBusy(true);
    joining
      .then((room) => {
        const url = new URL(window.location.href);
        url.searchParams.set(ROOM_PARAM, room.roomId);
        window.history.replaceState(null, "", url);
        this.scene.start("online");
      })
      .catch(() => {
        this.panel?.setBusy(false);
        this.panel?.showError("Sala nao encontrada ou cheia");
      });
  }
}
