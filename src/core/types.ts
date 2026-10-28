export const PIECE_TYPES = ["I", "O", "T", "S", "Z", "J", "L"] as const;
export type PieceType = (typeof PIECE_TYPES)[number];

/** 空のマスは null。ブロックのあるマスは、ミノの種類（色の決定に使う）。 */
export type Cell = PieceType | null;

/** 20 行 × 10 列。行 0 が最上段。更新時は新しい配列を作り、元は変更しない。 */
export type Board = readonly (readonly Cell[])[];

/** 操作中のミノ。x, y は、形の行列の左上の位置（列, 行）。向き 0 が最初の向き。 */
export interface ActivePiece {
  readonly type: PieceType;
  readonly rotation: number;
  readonly x: number;
  readonly y: number;
}

/** 0 以上 1 未満の数を返す関数。テストでは固定列を返す関数を注入する。 */
export type Rng = () => number;

export type Action =
  | "left"
  | "right"
  | "rotate"
  | "softDrop"
  | "hardDrop"
  | "tick"
  | "togglePause"
  | "restart";

export type Status = "playing" | "paused" | "gameover";

export interface GameState {
  readonly board: Board;
  readonly active: ActivePiece | null;
  readonly queue: readonly PieceType[];
  readonly score: number;
  readonly lines: number;
  readonly status: Status;
  readonly pieceCount: number;
  readonly rng: Rng;
}
