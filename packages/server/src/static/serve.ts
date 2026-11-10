/**
 * Serve o build do cliente pelo mesmo processo do WebSocket.
 *
 * So le arquivos de dentro de `root`: o caminho pedido e normalizado e
 * conferido, entao "../" nao sai da pasta. As rotas de matchmaking do
 * Colyseus nem chegam aqui: index.ts as desvia antes.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
};

/** Prefixo das rotas HTTP do Colyseus. */
export const MATCHMAKE_PREFIX = "/matchmake/";
/** Arquivos com hash no nome podem ficar em cache por um ano. */
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const NO_CACHE = "no-cache";

async function fileFor(root: string, urlPath: string): Promise<string | null> {
  const decoded = decodeURIComponent(urlPath);
  const candidate = resolve(join(root, normalize(decoded)));
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    return null;
  }
  try {
    const info = await stat(candidate);
    if (info.isFile()) {
      return candidate;
    }
    if (info.isDirectory()) {
      return fileFor(root, join(decoded, "index.html"));
    }
  } catch {
    return null;
  }
  return null;
}

export function createStaticHandler(rootDir: string) {
  const root = resolve(rootDir);

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }

    let file: string | null;
    try {
      file = await fileFor(root, url.pathname);
    } catch {
      file = null;
    }
    if (file === null) {
      res.writeHead(404, { "content-type": "text/plain" }).end("not found");
      return;
    }

    const type = CONTENT_TYPES[extname(file)] ?? "application/octet-stream";
    const cache = file.includes(`${sep}assets${sep}`) ? IMMUTABLE_CACHE : NO_CACHE;
    res.writeHead(200, {
      "content-type": type,
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  };
}
