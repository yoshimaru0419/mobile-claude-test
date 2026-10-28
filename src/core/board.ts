import { getCells } from "./pieces";
import type { ActivePiece, Board, Cell } from "./types";

export const ROWS = 20;
export const COLS = 10;

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

/** ミノの占めるマスが、壁・床の外、または固定済みブロックと重なるか。行が 0 未満のマスは空きとして扱う。 */
export function collides(board: Board, piece: ActivePiece): boolean {
  for (const [dc, dr] of getCells(piece.type, piece.rotation)) {
    const col = piece.x + dc;
    const row = piece.y + dr;
    if (col < 0 || col >= COLS || row >= ROWS) return true;
    if (row >= 0 && (board[row]?.[col] ?? null) !== null) return true;
  }
  return false;
}

/** ミノを盤面に書き込んだ、新しい盤面。 */
export function lock(board: Board, piece: ActivePiece): Board {
  const next = board.map((row) => [...row]);
  for (const [dc, dr] of getCells(piece.type, piece.rotation)) {
    const row = next[piece.y + dr];
    if (row !== undefined) row[piece.x + dc] = piece.type;
  }
  return next;
}

/** 左右に動かす。重なる場合は、元のミノを返す。 */
export function shifted(board: Board, piece: ActivePiece, dx: number): ActivePiece {
  const moved = { ...piece, x: piece.x + dx };
  return collides(board, moved) ? piece : moved;
}

/** 時計回りに回す（壁蹴りなし）。重なる場合は、元のミノを返す。 */
export function rotated(board: Board, piece: ActivePiece): ActivePiece {
  const turned = { ...piece, rotation: (piece.rotation + 1) % 4 };
  return collides(board, turned) ? piece : turned;
}
