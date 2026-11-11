/**
 * Relogio da rodada numa placa no topo (vermelha na morte subita), contagem
 * regressiva com os digitos grandes e aviso central sobre o banner.
 * Tudo posicionado em pixels inteiros, com origem no canto superior esquerdo,
 * para nenhum pixel de arte cair entre dois pixels de tela.
 */
import type Phaser from "phaser";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, MatchPhase, type MatchState } from "@pixelboom/shared";
import { BANNER_BORDA, DIGITOS, TEXTURA } from "../atlas/atlas-registry.js";
import { paraFonteHud, textoHud } from "./pixel-text.js";

const HUD_DEPTH = 100;
const SECONDS_PER_MINUTE = 60;
/** Tom aplicado na placa e no texto durante a morte subita. */
const TINT_PERIGO = 0xff7a6a;
const TINT_NORMAL = 0xffffff;
/** Folga do texto ate a borda interna da placa do topo e do banner central. */
const PLACA_PADDING_X = 20;
const PLACA_TOPO_Y = 0;
/** A placa ocupa a faixa de borda do topo, um tile de altura. */
const PLACA_TOPO_ALTURA = 32;
const BANNER_PADDING_X = 20;
const BANNER_PADDING_Y = 15;
/** Escalas inteiras: aviso central e digitos da contagem em 2x. */
const ESCALA_AVISO = 2;
const ESCALA_CONTAGEM = 2;
const MAIOR_DIGITO = 9;

function relogio(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const min = Math.floor(total / SECONDS_PER_MINUTE);
  const seg = total % SECONDS_PER_MINUTE;
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

function placa(scene: Phaser.Scene): Phaser.GameObjects.NineSlice {
  return scene.add
    .nineslice(
      0,
      0,
      TEXTURA.uiBanner,
      undefined,
      BANNER_BORDA.lateral * 2,
      BANNER_BORDA.vertical * 2,
      BANNER_BORDA.lateral,
      BANNER_BORDA.lateral,
      BANNER_BORDA.vertical,
      BANNER_BORDA.vertical,
    )
    .setOrigin(0, 0)
    .setDepth(HUD_DEPTH);
}

/** Centraliza `largura` em `centro`, arredondando para pixel inteiro. */
function esquerda(centro: number, largura: number): number {
  return Math.round(centro - largura / 2);
}

export class TimerHud {
  private readonly placaTopo: Phaser.GameObjects.NineSlice;
  private readonly topo: Phaser.GameObjects.BitmapText;
  private readonly banner: Phaser.GameObjects.NineSlice;
  private readonly centro: Phaser.GameObjects.BitmapText;
  private readonly contagem: Phaser.GameObjects.Image;
  private textoTopo = "";
  private textoCentro = "";

  constructor(scene: Phaser.Scene) {
    this.placaTopo = placa(scene);
    this.topo = textoHud(scene, 0, 0, "").setDepth(HUD_DEPTH);
    this.banner = placa(scene).setVisible(false);
    this.centro = textoHud(scene, 0, 0, "", ESCALA_AVISO).setDepth(HUD_DEPTH);
    this.contagem = scene.add
      .image(0, 0, DIGITOS.chave, 0)
      .setOrigin(0, 0)
      .setScale(ESCALA_CONTAGEM)
      .setDepth(HUD_DEPTH)
      .setVisible(false);
  }

  /** `banner` aparece no centro, exceto durante a contagem regressiva. */
  render(state: MatchState, prefix: string, banner: string | null): void {
    const clock = relogio(state.elapsed);
    const perigo = state.phase === MatchPhase.SuddenDeath;
    switch (state.phase) {
      case MatchPhase.Countdown:
        this.setTopo(prefix, false);
        this.setContagem(Math.ceil(-state.elapsed));
        this.setCentro("");
        return;
      case MatchPhase.SuddenDeath:
        this.setTopo(`${prefix}  MORTE SUBITA  ${clock}`, perigo);
        break;
      default:
        this.setTopo(`${prefix}  ${clock}`, false);
    }
    this.setContagem(null);
    this.setCentro(banner ?? "");
  }

  private setTopo(texto: string, perigo: boolean): void {
    const tint = perigo ? TINT_PERIGO : TINT_NORMAL;
    this.placaTopo.setTint(tint);
    this.topo.setTint(tint);
    const final = paraFonteHud(texto.trim());
    // Placa sem texto vira um toco de madeira solto: so aparece com conteudo.
    this.placaTopo.setVisible(final !== "");
    this.topo.setVisible(final !== "");
    if (final === this.textoTopo) {
      return;
    }
    this.textoTopo = final;
    this.topo.setText(final);
    const largura = this.topo.width + PLACA_PADDING_X * 2;
    const altura = PLACA_TOPO_ALTURA;
    const x = esquerda(LOGICAL_WIDTH / 2, largura);
    this.placaTopo.setSize(largura, altura).setPosition(x, PLACA_TOPO_Y);
    this.topo.setPosition(x + PLACA_PADDING_X, PLACA_TOPO_Y + Math.round((altura - this.topo.height) / 2));
  }

  private setCentro(texto: string): void {
    const final = paraFonteHud(texto);
    if (final !== this.textoCentro) {
      this.textoCentro = final;
      this.centro.setText(final);
      const largura = this.centro.width + BANNER_PADDING_X * 2;
      const altura = this.centro.height + BANNER_PADDING_Y * 2;
      const x = esquerda(LOGICAL_WIDTH / 2, largura);
      const y = esquerda(LOGICAL_HEIGHT / 2, altura);
      this.banner.setSize(largura, altura).setPosition(x, y);
      this.centro.setPosition(x + BANNER_PADDING_X, y + BANNER_PADDING_Y);
    }
    const visivel = final !== "";
    this.banner.setVisible(visivel);
    this.centro.setVisible(visivel);
  }

  private setContagem(valor: number | null): void {
    if (valor === null || valor < 0 || valor > MAIOR_DIGITO) {
      this.contagem.setVisible(false);
      return;
    }
    const largura = DIGITOS.larguraFrame * ESCALA_CONTAGEM;
    const altura = DIGITOS.alturaFrame * ESCALA_CONTAGEM;
    this.contagem
      .setFrame(valor)
      .setPosition(esquerda(LOGICAL_WIDTH / 2, largura), esquerda(LOGICAL_HEIGHT / 2, altura))
      .setVisible(true);
  }
}
