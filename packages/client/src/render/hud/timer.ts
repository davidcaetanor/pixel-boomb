/** Contagem regressiva, relogio, aviso de morte subita e resultado da rodada. */
import type Phaser from "phaser";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, MatchPhase, type MatchState } from "@pixelboom/shared";

const HUD_DEPTH = 100;
const COR_NORMAL = "#f4ecd8";
const COR_PERIGO = "#ff5a4a";
const SECONDS_PER_MINUTE = 60;
const MARGEM_TOPO = 4;

function relogio(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const min = Math.floor(total / SECONDS_PER_MINUTE);
  const seg = total % SECONDS_PER_MINUTE;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export class TimerHud {
  private readonly topo: Phaser.GameObjects.Text;
  private readonly centro: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private readonly localId: string) {
    const estilo = {
      fontFamily: "monospace",
      color: COR_NORMAL,
      stroke: "#14121c",
      strokeThickness: 3,
    };
    this.topo = scene.add
      .text(LOGICAL_WIDTH / 2, MARGEM_TOPO, "", { ...estilo, fontSize: "14px" })
      .setOrigin(0.5, 0)
      .setDepth(HUD_DEPTH);
    this.centro = scene.add
      .text(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, "", { ...estilo, fontSize: "28px", align: "center" })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH);
  }

  render(state: MatchState): void {
    switch (state.phase) {
      case MatchPhase.Countdown:
        this.topo.setText("");
        this.centro.setText(String(Math.ceil(-state.elapsed))).setColor(COR_NORMAL);
        return;
      case MatchPhase.Playing:
        this.topo.setText(relogio(state.elapsed)).setColor(COR_NORMAL);
        this.centro.setText("");
        return;
      case MatchPhase.SuddenDeath:
        this.topo.setText(`MORTE SUBITA  ${relogio(state.elapsed)}`).setColor(COR_PERIGO);
        this.centro.setText("");
        return;
      case MatchPhase.Finished:
        this.topo.setText(relogio(state.elapsed)).setColor(COR_NORMAL);
        this.centro.setText(`${this.resultado(state)}\nEnter: nova rodada`).setColor(COR_NORMAL);
        return;
    }
  }

  renderWaiting(connected: number, needed: number): void {
    this.topo.setText("");
    this.centro.setText(`Aguardando jogadores\n${connected}/${needed}`).setColor(COR_NORMAL);
  }

  /** Jogador que entrou durante a rodada e aguarda a proxima. */
  renderSpectator(state: MatchState): void {
    this.render(state);
    if (state.phase !== MatchPhase.Finished) {
      this.centro.setText("Assistindo\nvoce entra na proxima rodada").setColor(COR_NORMAL);
    }
  }

  private resultado(state: MatchState): string {
    if (state.winnerId === null) {
      return state.players.length > 1 ? "Empate" : "Fim de rodada";
    }
    return state.winnerId === this.localId ? "Vitoria" : "Derrota";
  }
}
