/**
 * Conexao com a sala. Em producao pagina e WebSocket compartilham a origem; em
 * desenvolvimento o servidor roda em DEV_SERVER_PORT, separado do Vite. A sala
 * ativa e mantida entre rodadas.
 */
import { Client, type Room } from "@colyseus/sdk";

const DEV_SERVER_PORT = 2567;
const ROOM_NAME = "match";

function serverUrl(): string {
  const override = import.meta.env["VITE_SERVER_URL"] as string | undefined;
  if (override !== undefined && override !== "") {
    return override;
  }
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:${DEV_SERVER_PORT}`;
  }
  return window.location.origin;
}

let active: Room | null = null;

/** A entrada conclui antes do primeiro estado; a sala so e entregue com o estado ja recebido. */
async function withFirstState(joining: Promise<Room>): Promise<Room> {
  const room = await joining;
  await new Promise<void>((resolve) => room.onStateChange.once(() => resolve()));
  active = room;
  room.onLeave(() => {
    if (active === room) {
      active = null;
    }
  });
  return room;
}

export function createRoom(): Promise<Room> {
  return withFirstState(new Client(serverUrl()).create(ROOM_NAME));
}

export function joinRoom(code: string): Promise<Room> {
  return withFirstState(new Client(serverUrl()).joinById(code));
}

export function activeRoom(): Room | null {
  return active;
}
