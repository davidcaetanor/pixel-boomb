/**
 * Conexao unica por aba, reaproveitada entre rodadas. Em producao pagina e
 * WebSocket compartilham a origem; em desenvolvimento o servidor roda em
 * DEV_SERVER_PORT, separado do Vite.
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

let current: Promise<Room> | null = null;

/** A entrada conclui antes do primeiro estado; a sala so e entregue com o estado ja recebido. */
async function joinWithState(): Promise<Room> {
  const room = await new Client(serverUrl()).joinOrCreate(ROOM_NAME);
  await new Promise<void>((resolve) => room.onStateChange.once(() => resolve()));
  return room;
}

export function joinMatch(): Promise<Room> {
  if (current === null) {
    current = joinWithState();
    current.catch(() => {
      current = null;
    });
  }
  return current;
}
