import { describe, expect, test } from "vitest";
import {
  clearLines,
  collides,
  COLS,
  createBoard,
  landingY,
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

describe("F-07/F-14 landingY", () => {
  test("F-07 空の盤面では、床に着く y（横 I は 18、縦 I は 16）", () => {
    expect(landingY(createBoard(), piece("I", 3, 0))).toBe(18);
    expect(landingY(createBoard(), piece("I", 3, 0, 1))).toBe(16);
  });

  test("F-07 すでに着地位置なら、y は変わらない", () => {
    expect(landingY(createBoard(), piece("I", 3, 18))).toBe(18);
  });

  test("F-07 固定済みブロックの上に着地する", () => {
    const board = boardOf({ 15: "...Z......" });
    // 横 I は行 y+1。列 3 の行 15 の上（行 14）に載る → y = 13
    expect(landingY(board, piece("I", 3, 0))).toBe(13);
  });

  test("F-07 元のミノは変更されない", () => {
    const p = piece("I", 3, 0);
    landingY(createBoard(), p);
    expect(p.y).toBe(0);
  });
});


describe("F-08 clearLines", () => {
  test("F-08 0 行: 盤面は変わらず、消去数 0", () => {
    const board = boardOf({ 19: "ZZZZZZZZZ." });
    const r = clearLines(board);
    expect(r.cleared).toBe(0);
    expect(r.board).toEqual(board);
  });

  test("F-08 空の盤面でも 0 行", () => {
    expect(clearLines(createBoard()).cleared).toBe(0);
  });

  test("F-08 1 行: 消えて、上の行が 1 段下に詰まり、最上段に空行が入る", () => {
    const board = boardOf({ 17: "I.........", 18: ".T........", 19: "ZZZZZZZZZZ" });
    const r = clearLines(board);
    expect(r.cleared).toBe(1);
    expect(r.board).toHaveLength(20);
    expect(r.board[19]).toEqual(board[18]);
    expect(r.board[18]).toEqual(board[17]);
    expect(r.board[0]?.every((c) => c === null)).toBe(true);
    expect(r.board.every((row) => row.length === 10)).toBe(true);
  });

  test("F-08 複数行（2 行・3 行）を同時に消せる", () => {
    const two = boardOf({ 18: "ZZZZZZZZZZ", 19: "SSSSSSSSSS" });
    expect(clearLines(two).cleared).toBe(2);
    const three = boardOf({ 16: "LLLLLLLLLL", 17: "JJJJJJJJJJ", 18: "OOOOOOOOOO", 15: "T........." });
    const r = clearLines(three);
    expect(r.cleared).toBe(3);
    expect(r.board[18]?.[0]).toBe("T");
  });

  test("F-08 4 行同時: 400 点相当の 4 行が消え、上の行が 4 段下に詰まる", () => {
    const board = boardOf({
      14: "T.........",
      15: ".T........",
      16: "ZZZZZZZZZZ",
      17: "ZZZZZZZZZZ",
      18: "ZZZZZZZZZZ",
      19: "ZZZZZZZZZZ",
    });
    const r = clearLines(board);
    expect(r.cleared).toBe(4);
    expect(r.board[18]).toEqual(board[14]);
    expect(r.board[19]).toEqual(board[15]);
    expect(r.board.slice(0, 18).every((row) => row.every((c) => c === null))).toBe(true);
  });

  test("F-08 詰まり方: 離れた行を消しても、残った行の順序は変わらない", () => {
    const board = boardOf({
      15: "I.........",
      16: "ZZZZZZZZZZ",
      17: ".O........",
      18: "ZZZZZZZZZZ",
      19: "..T.......",
    });
    const r = clearLines(board);
    expect(r.cleared).toBe(2);
    expect(r.board[17]).toEqual(board[15]);
    expect(r.board[18]).toEqual(board[17]);
    expect(r.board[19]).toEqual(board[19]);
  });

  test("F-08 1 マスだけ空いた行は消えない（境界）", () => {
    const board = boardOf({ 19: ".ZZZZZZZZZ", 18: "ZZZZZZZZZ." });
    expect(clearLines(board).cleared).toBe(0);
  });

  test("F-08 元の盤面を変更しない", () => {
    const board = boardOf({ 18: "I.........", 19: "ZZZZZZZZZZ" });
    const snapshot = JSON.stringify(board);
    clearLines(board);
    expect(JSON.stringify(board)).toBe(snapshot);
  });
});
