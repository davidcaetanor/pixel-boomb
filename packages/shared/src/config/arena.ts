/**
 * Dimensoes da arena e pontos de spawn. Dimensoes impares permitem o padrao de
 * pilares em posicoes pares. A altura de 13 linhas a 32 px com zoom 2 cabe em
 * uma janela 1080p; a arena cresce em colunas.
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
  /** Vizinhas ortogonais mantidas livres junto com o spawn. */
  readonly clearance: readonly { readonly x: number; readonly y: number }[];
}

/**
 * Pontos em ordem ao redor da arena, no corredor da borda, a 8 celulas de
 * caminhada do vizinho em qualquer layout. Os cantos ficam de fora porque
 * deixariam um vizinho mais proximo que o outro.
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

/** Spawns e suas vizinhas livres, que nunca recebem caixa. */
export const SPAWN_SAFE_INDICES: ReadonlySet<number> = new Set(
  SPAWN_POINTS.flatMap((spawn) => [
    cellIndex(spawn.x, spawn.y),
    ...spawn.clearance.map((cell) => cellIndex(cell.x, cell.y)),
  ]),
);
