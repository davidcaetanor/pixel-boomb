/**
 * Entrada do servidor.
 *
 * Na semana 1 o servidor nao faz nada alem de provar que importa shared e que
 * a regra de dependencia vale. A sala Colyseus autoritativa, o schema e o
 * servico unico servindo estatico + WebSocket entram na semana 2
 * (docs/06-checklist.md).
 */
import { ARENA_COLS, ARENA_ROWS, BALANCE, TICK_SECONDS } from "@pixelboom/shared";

const port = Number(process.env["PORT"] ?? 2567);

console.log("PixelBoom server");
console.log(`  arena      ${ARENA_COLS}x${ARENA_ROWS}`);
console.log(`  tick       ${BALANCE.simulation.tickHz} Hz (${TICK_SECONDS.toFixed(4)}s)`);
console.log(`  por sala   ${BALANCE.net.maxClientsPerRoom} jogadores`);
console.log(`  porta      ${port} (ainda sem listen: semana 2)`);
