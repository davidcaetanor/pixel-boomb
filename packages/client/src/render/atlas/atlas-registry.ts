/**
 * Registro unico dos nomes de textura. O sufixo "-provisorio" marca recortes
 * diretos da arte crua, a serem substituidos pelo atlas definitivo.
 */
export const TEXTURA = {
  pisoClaro: "piso-claro",
  pisoEscuro: "piso-escuro",
  pilar: "pilar",
  caixa: "caixa",
  arvore: "arvore-provisorio",
  arvorePequena: "arvore-p-provisorio",
  spawn: "spawn-provisorio",
  bomba: "bomba-provisorio",
  chamaCentro: "chama-centro-provisorio",
  chamaHorizontal: "chama-horizontal-provisorio",
  chamaVertical: "chama-vertical-provisorio",
  powerupBomba: "powerup-bomba",
  powerupAlcance: "powerup-alcance",
  powerupVelocidade: "powerup-velocidade",
  uiSeta: "ui-seta",
  uiBadge: "ui-badge",
  uiBanner: "ui-banner",
  uiFonte: "ui-fonte",
  uiVitoria: "ui-vitoria",
  uiVitoriaVazia: "ui-vitoria-vazia",
} as const;

/** Digitos grandes 0-9 da contagem regressiva, um quadro por digito. */
export const DIGITOS = { chave: "ui-digitos", larguraFrame: 19, alturaFrame: 32 } as const;

/** Bordas fixas do banner no 9-slice, em pixels da textura. */
export const BANNER_BORDA = { lateral: 15, vertical: 15 } as const;

export type NomeTextura = (typeof TEXTURA)[keyof typeof TEXTURA];

/** Caminho publico de cada textura. */
export function caminhoDaTextura(nome: NomeTextura): string {
  return `/${nome}.png`;
}

/**
 * Formato das folhas de personagem: uma linha por direcao, na ordem de
 * DIRECOES_FOLHA. A coluna 0 e o quadro parado e as seguintes, a caminhada.
 * Quadros de 48x48 com o personagem na escala do tile de 32.
 */
export const FOLHA_PERSONAGEM = {
  larguraFrame: 48,
  alturaFrame: 48,
  colunas: 8,
  framesCaminhada: 6,
  /** Ultima coluna: o quadro de respiracao, alternado com o parado. */
  colunaRespiracao: 7,
} as const;

export const DIRECOES_FOLHA = ["south", "west", "east", "north"] as const;
export type DirecaoFolha = (typeof DIRECOES_FOLHA)[number];

/** Elenco na ordem dos indices de personagem. */
export const ELENCO = [
  "bender",
  "cogu",
  "gamabunta",
  "golem",
  "karasuno",
  "octus",
  "papyrus",
  "tommy",
] as const;

export function chaveDoPersonagem(character: number): string {
  return `personagem-${ELENCO[character % ELENCO.length] ?? ELENCO[0]}`;
}

export function caminhoDaFolha(chave: string): string {
  return `/${chave}.png`;
}
