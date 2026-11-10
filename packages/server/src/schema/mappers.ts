/**
 * Unico ponto de escrita do MatchSchema. Listas pequenas sao reescritas a cada
 * tick; a grade e atualizada celula a celula para enviar so a diferenca.
 */
import { ArraySchema } from "@colyseus/schema";
import type { MatchState } from "@pixelboom/shared";
import {
  BombSchema,
  ExplosionSchema,
  PlayerSchema,
  PowerUpSchema,
  WAITING_PHASE,
  type MatchSchema,
} from "./match-schema.js";

function writeGrid(target: MatchSchema, cells: Uint8Array): void {
  if (target.cells.length !== cells.length) {
    target.cells = new ArraySchema<number>(...cells);
    return;
  }
  cells.forEach((value, i) => {
    if (target.cells[i] !== value) {
      target.cells[i] = value;
    }
  });
}

export function writeMatch(target: MatchSchema, state: MatchState): void {
  target.phase = state.phase;
  target.tick = state.tick;
  target.elapsed = state.elapsed;
  target.winnerId = state.winnerId ?? "";
  writeGrid(target, state.grid.cells);

  const ids = new Set(state.players.map((p) => p.id));
  for (const id of [...target.players.keys()]) {
    if (!ids.has(id)) {
      target.players.delete(id);
    }
  }
  for (const p of state.players) {
    const s = target.players.get(p.id) ?? new PlayerSchema();
    s.id = p.id;
    s.slot = p.slot;
    s.x = p.x;
    s.y = p.y;
    s.facing = p.facing;
    s.alive = p.alive;
    s.speed = p.speed;
    s.maxBombs = p.maxBombs;
    s.range = p.range;
    if (!target.players.has(p.id)) {
      target.players.set(p.id, s);
    }
  }

  target.bombs = new ArraySchema<BombSchema>(
    ...state.bombs.map((b) => Object.assign(new BombSchema(), { id: b.id, x: b.x, y: b.y })),
  );
  target.explosions = new ArraySchema<ExplosionSchema>(
    ...state.explosions.map((e) =>
      Object.assign(new ExplosionSchema(), { id: e.id, cells: new ArraySchema<number>(...e.cells) }),
    ),
  );
  target.powerUps = new ArraySchema<PowerUpSchema>(
    ...state.powerUps.map((p) => Object.assign(new PowerUpSchema(), { kind: p.kind, x: p.x, y: p.y })),
  );
}

export function writeWaiting(target: MatchSchema, connected: number): void {
  target.phase = WAITING_PHASE;
  target.connected = connected;
  target.winnerId = "";
  target.players.clear();
  target.bombs = new ArraySchema<BombSchema>();
  target.explosions = new ArraySchema<ExplosionSchema>();
  target.powerUps = new ArraySchema<PowerUpSchema>();
}
