/**
 * Registro unico dos nomes de textura. O sufixo "-provisorio" marca recortes
 * diretos da arte crua, a serem substituidos pelo atlas definitivo.
 */
export const TEXTURA = {
  piso: "piso-provisorio",
  pilar: "pilar-provisorio",
  caixa: "caixa-provisorio",
  arvore: "arvore-provisorio",
  arvorePequena: "arvore-p-provisorio",
  spawn: "spawn-provisorio",
  bomba: "bomba-provisorio",
  chamaCentro: "chama-centro-provisorio",
  chamaHorizontal: "chama-horizontal-provisorio",
  chamaVertical: "chama-vertical-provisorio",
  powerupBomba: "powerup-bomba-provisorio",
  powerupAlcance: "powerup-alcance-provisorio",
  powerupVelocidade: "powerup-velocidade-provisorio",
} as const;

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
  colunas: 7,
  framesCaminhada: 6,
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
  return `personagem-${ELENCO[character % ELENCO.length] ?? ELENCO[0]}-provisorio`;
}

export function caminhoDaFolha(chave: string): string {
  return `/${chave}.png`;
}
