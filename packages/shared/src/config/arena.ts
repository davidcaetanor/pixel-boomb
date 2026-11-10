/**
 * Layout da arena: dimensoes, paredes estaticas e pontos de spawn.
 *
 * 25 x 13 e impar x impar de proposito: permite o padrao de pilares do
 * Bomberman (pilar em toda posicao par do interior, corredor em toda impar),
 * o que garante que nenhum corredor fique sem saida.
 *
 * A altura determina o zoom: 13 linhas x 32 px = 416, que a 2x da 832 e cabe
 * numa janela 1080p com barra do navegador e HUD. Para arena maior, cresca em
 * colunas, nunca em linhas.
 */
export const ARENA_COLS = 25;
export const ARENA_ROWS = 13;
export const TILE_SIZE = 32;
export const RENDER_ZOOM = 2;

export const LOGICAL_WIDTH = ARENA_COLS * TILE_SIZE;
export const LOGICAL_HEIGHT = ARENA_ROWS * TILE_SIZE;

/** Deslocamento do canto ao centro de uma celula, em unidades de celula. */
export const CELL_CENTER = 0.5;

export const CELL_COUNT = ARENA_COLS * ARENA_ROWS;

/** Perimetro indestrutivel. */
export function isBorder(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === ARENA_COLS - 1 || y === ARENA_ROWS - 1;
}

export function isInside(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < ARENA_COLS && y < ARENA_ROWS;
}

export function cellIndex(x: number, y: number): number {
  return y * ARENA_COLS + x;
}

export function cellX(index: number): number {
  return index % ARENA_COLS;
}

export function cellY(index: number): number {
  return Math.floor(index / ARENA_COLS);
}

export interface SpawnPoint {
  /** Celula onde o jogador nasce. */
  readonly x: number;
  readonly y: number;
  /**
   * As duas vizinhas ortogonais que ficam livres junto com a celula do spawn,
   * formando um L de 3 celulas para o jogador nao nascer encurralado.
   */
  readonly clearance: readonly { readonly x: number; readonly y: number }[];
}

/**
 * 8 pontos no corredor da borda, em ordem ao redor da arena, a 8 celulas de
 * caminhada um do outro. O corredor da borda e livre em todo layout, entao a
 * distancia entre vizinhos e a mesma em qualquer rodada. Nenhum ponto fica no
 * canto: o canto deixaria um vizinho mais perto que o outro.
 */
export const SPAWN_POINTS: readonly SpawnPoint[] = [
  { x: 8, y: 1, clearance: [{ x: 7, y: 1 }, { x: 9, y: 1 }] },
  { x: 16, y: 1, clearance: [{ x: 15, y: 1 }, { x: 17, y: 1 }] },
  { x: 23, y: 2, clearance: [{ x: 23, y: 1 }, { x: 23, y: 3 }] },
  { x: 23, y: 10, clearance: [{ x: 23, y: 9 }, { x: 23, y: 11 }] },
  { x: 16, y: 11, clearance: [{ x: 15, y: 11 }, { x: 17, y: 11 }] },
  { x: 8, y: 11, clearance: [{ x: 7, y: 11 }, { x: 9, y: 11 }] },
  { x: 1, y: 10, clearance: [{ x: 1, y: 9 }, { x: 1, y: 11 }] },
  { x: 1, y: 2, clearance: [{ x: 1, y: 1 }, { x: 1, y: 3 }] },
] as const;

/**
 * Indices de celula que nunca recebem caixa: os spawns e suas clearances.
 * Calculado uma vez; a geracao de mapa consulta isto.
 */
export const SPAWN_SAFE_INDICES: ReadonlySet<number> = new Set(
  SPAWN_POINTS.flatMap((spawn) => [
    cellIndex(spawn.x, spawn.y),
    ...spawn.clearance.map((cell) => cellIndex(cell.x, cell.y)),
  ]),
);
