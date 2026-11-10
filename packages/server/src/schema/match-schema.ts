/** Formato de transporte do estado; o modelo de dominio e o MatchState de shared. */
import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") id = "";
  @type("uint8") slot = 0;
  /** Precisao total: a predicao do cliente parte destes valores e precisa coincidir com o servidor. */
  @type("float64") x = 0;
  @type("float64") y = 0;
  @type("string") facing = "south";
  @type("boolean") alive = true;
  @type("float64") speed = 0;
  @type("uint8") maxBombs = 0;
  @type("uint8") range = 0;
  @type("uint8") roundsWon = 0;
  /** Ultima entrada do jogador aplicada pelo servidor. */
  @type("uint32") ackSeq = 0;
}

export class BombSchema extends Schema {
  @type("uint32") id = 0;
  @type("uint8") x = 0;
  @type("uint8") y = 0;
}

export class ExplosionSchema extends Schema {
  @type("uint32") id = 0;
  @type(["uint16"]) cells = new ArraySchema<number>();
}

export class PowerUpSchema extends Schema {
  @type("uint8") kind = 0;
  @type("uint8") x = 0;
  @type("uint8") y = 0;
}

/** Fase de transporte: sala aguardando jogadores. */
export const WAITING_PHASE = "waiting";

export class MatchSchema extends Schema {
  @type("string") phase = WAITING_PHASE;
  @type("uint32") tick = 0;
  @type("float32") elapsed = 0;
  /** Vazio em empate ou durante a rodada. */
  @type("string") winnerId = "";
  @type("uint8") connected = 0;
  /** Rodada atual da serie, a partir de 1. */
  @type("uint8") round = 0;
  @type("boolean") seriesFinished = false;
  /** Vazio enquanto a serie nao terminou ou se terminou empatada. */
  @type("string") seriesWinnerId = "";
  @type(["uint8"]) cells = new ArraySchema<number>();
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([BombSchema]) bombs = new ArraySchema<BombSchema>();
  @type([ExplosionSchema]) explosions = new ArraySchema<ExplosionSchema>();
  @type([PowerUpSchema]) powerUps = new ArraySchema<PowerUpSchema>();
}
