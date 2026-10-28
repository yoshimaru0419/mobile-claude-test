import { createBoard } from "./board";
import type { Board, Cell, GameState, PieceType, Rng } from "./types";

/** 固定列を、順に（末尾まで来たら先頭から）返す乱数。 */
export function seqRng(values: readonly number[]): Rng {
  let i = 0;
  return () => {
    const v = values[i % values.length] as number;
    i++;
    return v;
  };
}

/** 常に 0.99 を返す乱数。シャッフルが恒等になり、I, O, T, S, Z, J, L の順に出る。 */
export const identityRng: Rng = () => 0.99;

/** 呼ばれた回数を数える、固定値の乱数。 */
export function countingRng(value: number): { rng: Rng; calls: () => number } {
  let n = 0;
  return {
    rng: () => {
      n++;
      return value;
    },
    calls: () => n,
  };
}

/**
 * 盤面を文字列で組み立てる。キーは行番号（0〜19）、値は 10 文字。
 * "." は空、I/O/T/S/Z/J/L は固定済みブロック。
 */
export function boardOf(rows: Record<number, string>): Board {
  const board = createBoard().map((r) => [...r]) as Cell[][];
  for (const [rowKey, text] of Object.entries(rows)) {
    const row = board[Number(rowKey)];
    if (row === undefined || text.length !== 10) throw new Error(`bad row ${rowKey}`);
    [...text].forEach((ch, c) => {
      row[c] = ch === "." ? null : (ch as PieceType);
    });
  }
  return board;
}

/** createGame の結果を土台に、一部を差し替えた GameState。 */
export function withState(base: GameState, patch: Partial<GameState>): GameState {
  return { ...base, ...patch };
}
