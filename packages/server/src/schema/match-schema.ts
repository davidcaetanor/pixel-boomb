/**
 * Formato de transporte do estado. Nao e o modelo de dominio: a regra roda
 * sobre MatchState de @pixelboom/shared, e mappers.ts copia o resultado para
 * ca a cada tick. O Colyseus envia ao cliente so o que mudou.
 */
import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") id = "";
  @type("uint8") slot = 0;
  @type("float32") x = 0;
  @type("float32") y = 0;
  @type("string") facing = "south";
  @type("boolean") alive = true;
  @type("float32") speed = 0;
  @type("uint8") maxBombs = 0;
  @type("uint8") range = 0;
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

/** Fase extra so do transporte: sala esperando jogadores para comecar. */
export const WAITING_PHASE = "waiting";

export class MatchSchema extends Schema {
  @type("string") phase = WAITING_PHASE;
  @type("uint32") tick = 0;
  @type("float32") elapsed = 0;
  /** Vazio quando nao ha vencedor (rodada em andamento ou empate). */
  @type("string") winnerId = "";
  /** Quantos estao conectados, para a tela de espera. */
  @type("uint8") connected = 0;
  @type(["uint8"]) cells = new ArraySchema<number>();
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([BombSchema]) bombs = new ArraySchema<BombSchema>();
  @type([ExplosionSchema]) explosions = new ArraySchema<ExplosionSchema>();
  @type([PowerUpSchema]) powerUps = new ArraySchema<PowerUpSchema>();
}
