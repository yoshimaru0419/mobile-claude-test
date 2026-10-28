import { describe, expect, test } from "vitest";
import {
  collides,
  COLS,
  createBoard,
  lock,
  ROWS,
  rotated,
  shifted,
} from "./board";
import { boardOf } from "./test-utils";
import type { ActivePiece } from "./types";

const piece = (type: ActivePiece["type"], x: number, y: number, rotation = 0): ActivePiece => ({
  type,
  rotation,
  x,
  y,
});

describe("F-01 createBoard", () => {
  test("F-01 20 行 × 10 列で、すべて空（null）", () => {
    const board = createBoard();
    expect(board).toHaveLength(20);
    expect(ROWS).toBe(20);
    expect(COLS).toBe(10);
    for (const row of board) {
      expect(row).toHaveLength(10);
      expect(row.every((c) => c === null)).toBe(true);
    }
  });

  test("F-01 呼ぶたびに独立した盤面（行を共有しない）", () => {
    const a = createBoard().map((r) => [...r]);
    const b = createBoard();
    expect(a).toEqual(b);
    expect(createBoard()[0]).not.toBe(createBoard()[0]);
  });
});

describe("F-01/F-04/F-05 collides", () => {
  const empty = createBoard();

  test("F-01 空の盤面の出現位置では重ならない", () => {
    expect(collides(empty, piece("T", 3, 0))).toBe(false);
  });

  test("F-04 左壁: 枠の外でもマスが盤内なら重ならない、マスが列 -1 なら重なる", () => {
    // I 向き 1 は枠の列 2 だけを使う: x=-2 で列 0（盤内）、x=-3 で列 -1（盤外）
    expect(collides(empty, piece("I", -2, 0, 1))).toBe(false);
    expect(collides(empty, piece("I", -3, 0, 1))).toBe(true);
    expect(collides(empty, piece("T", 0, 0))).toBe(false);
    expect(collides(empty, piece("T", -1, 0))).toBe(true);
  });

  test("F-04 右壁: 列 9 は盤内、列 10 は盤外", () => {
    expect(collides(empty, piece("T", 7, 0))).toBe(false);
    expect(collides(empty, piece("T", 8, 0))).toBe(true);
    expect(collides(empty, piece("I", 7, 0, 1))).toBe(false); // 列 9
    expect(collides(empty, piece("I", 8, 0, 1))).toBe(true); // 列 10
  });

  test("F-01 床: 行 19 は盤内、行 20 は盤外", () => {
    expect(collides(empty, piece("I", 3, 18))).toBe(false); // 行 19
    expect(collides(empty, piece("I", 3, 19))).toBe(true); // 行 20
  });

  test("F-01 行が 0 未満のマスは空きとして扱う（重ならない）", () => {
    expect(collides(empty, piece("I", 3, -1))).toBe(false); // 行 0
    expect(collides(empty, piece("I", 3, -2))).toBe(false); // 行 -1
    expect(collides(empty, piece("I", 3, -5, 1))).toBe(false); // 縦 I が一部だけ盤外の上
  });

  test("F-04 固定済みブロックとの重なり（重なる・隣接は重ならない）", () => {
    const board = boardOf({ 1: "....Z....." });
    expect(collides(board, piece("I", 1, 0))).toBe(true); // 列 1〜4 に 4 を含む
    expect(collides(board, piece("I", 0, 0))).toBe(false); // 列 0〜3、隣接
    expect(collides(board, piece("I", 5, 0))).toBe(false); // 列 5〜8、隣接
  });

  test("F-05 固定済みブロックが、形の枠内の空きマスにあっても重ならない", () => {
    // T 向き 0 は枠の (0,0) が空き。そこに固定ブロックがあっても重ならない
    const board = boardOf({ 4: "Z........." });
    expect(collides(board, piece("T", 0, 4))).toBe(false);
    // 頭のマス (1,0) に固定ブロックがあれば重なる
    expect(collides(boardOf({ 4: ".Z........" }), piece("T", 0, 4))).toBe(true);
  });
});

describe("F-01 lock", () => {
  test("F-01 占めるマスに種類を書き込んだ新しい盤面を返す", () => {
    const board = createBoard();
    const next = lock(board, piece("T", 3, 5));
    const filled: string[] = [];
    next.forEach((row, r) => row.forEach((c, col) => c !== null && filled.push(`${col},${r}:${c}`)));
    expect(filled.sort()).toEqual(["3,6:T", "4,5:T", "4,6:T", "5,6:T"].sort());
  });

  test("F-01 元の盤面を変更しない（別の配列を返す）", () => {
    const board = createBoard();
    const snapshot = JSON.stringify(board);
    const next = lock(board, piece("O", 0, 18));
    expect(JSON.stringify(board)).toBe(snapshot);
    expect(next).not.toBe(board);
    expect(next[19]).not.toBe(board[19]);
  });

  test("F-01 既存の固定ブロックは保持される", () => {
    const board = boardOf({ 19: "Z........." });
    const next = lock(board, piece("I", 3, 18));
    expect(next[19]?.[0]).toBe("Z");
    expect(next[19]?.slice(3, 7)).toEqual(["I", "I", "I", "I"]);
  });

  test("F-01 盤面の上（行が負）にはみ出すマスは無視され、例外にならない", () => {
    const next = lock(createBoard(), piece("I", 3, -1, 1)); // 縦 I: 行 -1..2
    const count = next.flat().filter((c) => c !== null).length;
    expect(count).toBe(3);
  });
});

describe("F-04 shifted", () => {
  const empty = createBoard();

  test("F-04 動ける場合は 1 列動く", () => {
    expect(shifted(empty, piece("T", 3, 5), -1)).toEqual(piece("T", 2, 5));
    expect(shifted(empty, piece("T", 3, 5), 1)).toEqual(piece("T", 4, 5));
  });

  test("F-04 左端で左へは動かない（境界: 内側の 1 つ手前は動く）", () => {
    const atWall = piece("T", 0, 5);
    expect(shifted(empty, atWall, -1)).toEqual(atWall);
    expect(shifted(empty, piece("T", 1, 5), -1)).toEqual(atWall);
  });

  test("F-04 右端で右へは動かない（境界: 内側の 1 つ手前は動く）", () => {
    const atWall = piece("T", 7, 5);
    expect(shifted(empty, atWall, 1)).toEqual(atWall);
    expect(shifted(empty, piece("T", 6, 5), 1)).toEqual(atWall);
  });

  test("F-04 固定済みブロックの横で、その方向へは動かない", () => {
    const left = boardOf({ 6: "..Z......." });
    expect(shifted(left, piece("T", 3, 5), -1)).toEqual(piece("T", 3, 5));
    expect(shifted(left, piece("T", 3, 5), 1)).toEqual(piece("T", 4, 5));
    const right = boardOf({ 6: "......Z..." });
    expect(shifted(right, piece("T", 3, 5), 1)).toEqual(piece("T", 3, 5));
    expect(shifted(right, piece("T", 3, 5), -1)).toEqual(piece("T", 2, 5));
  });

  test("F-04 移動しても向き・y は変わらない", () => {
    expect(shifted(empty, piece("L", 3, 7, 2), 1)).toEqual(piece("L", 4, 7, 2));
  });
});

describe("F-05 rotated", () => {
  const empty = createBoard();

  test("F-05 空きがあれば、向きが +1 される（位置は変わらない）", () => {
    expect(rotated(empty, piece("T", 3, 5))).toEqual(piece("T", 3, 5, 1));
    expect(rotated(empty, piece("T", 3, 5, 3))).toEqual(piece("T", 3, 5, 0));
  });

  test("F-05 回転後が床と重なるなら、回転しない（向きも位置も変わらない）", () => {
    const p = piece("I", 3, 18); // 横 I は行 19。縦にすると行 18〜21
    expect(rotated(empty, p)).toEqual(p);
  });

  test("F-05 回転後が壁と重なるなら、回転しない", () => {
    // 縦 I（向き 1）は列 0。向き 2 は横で列 -2..1 になり、壁と重なる
    const p = piece("I", -2, 5, 1);
    expect(rotated(empty, p)).toEqual(p);
  });

  test("F-05 回転後が固定済みブロックと重なるなら、回転しない", () => {
    // T 向き 0 → 1 で増える下のマス（枠の (1,2)）に固定ブロックがある
    const board = boardOf({ 7: ".Z........" });
    const p = piece("T", 0, 5);
    expect(rotated(board, p)).toEqual(p);
  });

  test("F-05 O は回転しても、形も位置も変わらない", () => {
    const p = piece("O", 4, 10);
    const r = rotated(empty, p);
    expect(r.x).toBe(4);
    expect(r.y).toBe(10);
    expect(collides(empty, r)).toBe(false);
    expect(lock(empty, r)).toEqual(lock(empty, p));
  });

  test("F-05 4 回回すと元に戻る（全 7 種、空の盤面）", () => {
    for (const type of ["I", "O", "T", "S", "Z", "J", "L"] as const) {
      let p = piece(type, 3, 5);
      for (let i = 0; i < 4; i++) p = rotated(empty, p);
      expect(lock(empty, p)).toEqual(lock(empty, piece(type, 3, 5)));
      expect(p.x).toBe(3);
      expect(p.y).toBe(5);
    }
  });
});
