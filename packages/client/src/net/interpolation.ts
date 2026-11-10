/**
 * Adversarios desenhados com atraso fixo, entre dois estados recebidos. O
 * atraso troca latencia por movimento continuo mesmo com patches irregulares.
 */
import { BALANCE, type Player } from "@pixelboom/shared";

interface Sample {
  readonly time: number;
  readonly players: ReadonlyMap<string, Player>;
}

/** Amostras guardadas; o suficiente para cobrir o atraso com folga. */
const MAX_SAMPLES = 16;

export class SnapshotBuffer {
  private samples: Sample[] = [];

  push(time: number, players: readonly Player[]): void {
    this.samples.push({ time, players: new Map(players.map((p) => [p.id, p])) });
    if (this.samples.length > MAX_SAMPLES) {
      this.samples.shift();
    }
  }

  clear(): void {
    this.samples = [];
  }

  /** Posicao de um jogador no instante `now` menos o atraso de interpolacao. */
  sample(id: string, now: number): Player | null {
    const target = now - BALANCE.net.interpolationBufferMs;
    let older: Player | null = null;
    let olderTime = 0;
    for (const s of this.samples) {
      const player = s.players.get(id);
      if (player === undefined) {
        continue;
      }
      if (s.time <= target) {
        older = player;
        olderTime = s.time;
        continue;
      }
      if (older === null) {
        return player;
      }
      const t = (target - olderTime) / (s.time - olderTime);
      return { ...player, x: older.x + (player.x - older.x) * t, y: older.y + (player.y - older.y) * t };
    }
    return older;
  }
}
