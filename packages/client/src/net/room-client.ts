/**
 * Conexao com a sala. Uma so por aba, reaproveitada entre rodadas.
 *
 * Em producao o jogo e o WebSocket saem do mesmo endereco, entao o cliente
 * conecta onde a pagina foi aberta. No `pnpm dev` a pagina vem do Vite e o
 * servidor roda a parte, em DEV_SERVER_PORT.
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

export function joinMatch(): Promise<Room> {
  if (current === null) {
    current = new Client(serverUrl()).joinOrCreate(ROOM_NAME);
    current.catch(() => {
      current = null;
    });
  }
  return current;
}
