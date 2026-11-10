/**
 * Processo unico para a pagina do jogo e o WebSocket.
 *
 * PORT       porta HTTP (2567)
 * HOST       interface de escuta (0.0.0.0)
 * STATIC_DIR build do cliente (packages/client/dist)
 */
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MatchRoom } from "./rooms/match-room.js";
import { MATCHMAKE_PREFIX, createStaticHandler } from "./static/serve.js";

const DEFAULT_PORT = 2567;
const here = dirname(fileURLToPath(import.meta.url));

const port = Number(process.env["PORT"] ?? DEFAULT_PORT);
const host = process.env["HOST"] ?? "0.0.0.0";
const staticDir = process.env["STATIC_DIR"] ?? resolve(here, "../../client/dist");

const httpServer = createServer();
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
  greet: false,
});
gameServer.define("match", MatchRoom);

await gameServer.listen(port, host);

// O Colyseus atende qualquer rota HTTP; somente matchmaking deve chegar a ele.
const colyseusHandlers = httpServer.listeners("request") as ((...args: unknown[]) => void)[];
const serveStatic = createStaticHandler(staticDir);
httpServer.removeAllListeners("request");
httpServer.on("request", (req, res) => {
  if ((req.url ?? "").startsWith(MATCHMAKE_PREFIX)) {
    for (const handler of colyseusHandlers) {
      handler.call(httpServer, req, res);
    }
    return;
  }
  void serveStatic(req, res);
});
console.log(`PixelBoom no ar em http://${host}:${port} (estatico: ${staticDir})`);

const shutdown = (): void => {
  void gameServer.gracefullyShutdown(true);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
