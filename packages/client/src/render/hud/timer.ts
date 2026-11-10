/** Relogio da rodada, contagem regressiva, aviso de morte subita e aviso central. */
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

  constructor(scene: Phaser.Scene) {
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

  /** `banner` aparece no centro, exceto durante a contagem regressiva. */
  render(state: MatchState, prefix: string, banner: string | null): void {
    const clock = relogio(state.elapsed);
    switch (state.phase) {
      case MatchPhase.Countdown:
        this.topo.setText(prefix).setColor(COR_NORMAL);
        this.centro.setText(String(Math.ceil(-state.elapsed)));
        return;
      case MatchPhase.SuddenDeath:
        this.topo.setText(`${prefix}  MORTE SUBITA  ${clock}`.trim()).setColor(COR_PERIGO);
        break;
      default:
        this.topo.setText(`${prefix}  ${clock}`.trim()).setColor(COR_NORMAL);
    }
    this.centro.setText(banner ?? "");
  }

  renderWaiting(connected: number, needed: number): void {
    this.topo.setText("");
    this.centro.setText(`Aguardando jogadores\n${connected}/${needed}`);
  }
}
