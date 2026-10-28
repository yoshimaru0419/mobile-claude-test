import { describe, expect, test } from "vitest";
import { createBoard, landingY } from "./board";
import { applyAction, createGame, ghostPiece, levelOf } from "./game";
import { boardOf, countingRng, identityRng, seqRng, withState } from "./test-utils";
import type { ActivePiece, GameState } from "./types";

/** identityRng のとき、最初の 2 つのバッグは I, O, T, S, Z, J, L の順。 */
const fresh = () => createGame(identityRng);
const cellsOf = (s: GameState) => s.board.flat().filter((c) => c !== null).length;
const at = (type: ActivePiece["type"], x: number, y: number, rotation = 0): ActivePiece => ({
  type,
  rotation,
  x,
  y,
});

describe("F-01/F-02/F-11 createGame（初期状態）", () => {
  test("F-01 盤面は 20 行 × 10 列ですべて空", () => {
    const s = fresh();
    expect(s.board).toEqual(createBoard());
  });

  test("F-09/F-10/F-13 スコア 0、lines 0、レベル 1、playing", () => {
    const s = fresh();
    expect(s.score).toBe(0);
    expect(s.lines).toBe(0);
    expect(levelOf(s.lines)).toBe(1);
    expect(s.status).toBe("playing");
  });

  test("F-02 最初のミノは、バッグの先頭。向き 0、x = 3、y = 0", () => {
    const s = fresh();
    expect(s.active).toEqual(at("I", 3, 0));
  });

  test("F-11 queue は 7 個以上で、先頭（NEXT）は 2 番目のミノ", () => {
    const s = fresh();
    expect(s.queue.length).toBeGreaterThanOrEqual(7);
    expect(s.queue[0]).toBe("O");
  });

  test("F-03 最初のミノが出た時点で pieceCount は 1", () => {
    expect(fresh().pieceCount).toBe(1);
  });

  test("F-02 同じ乱数列を注入すると、同じ初期状態（active と queue）", () => {
    const seq = [0.3, 0.8, 0.1, 0.55];
    const a = createGame(seqRng(seq));
    const b = createGame(seqRng(seq));
    expect(a.active).toEqual(b.active);
    expect(a.queue).toEqual(b.queue);
  });

  test("F-02 注入した乱数をそのまま保持する", () => {
    const rng = () => 0.99;
    expect(createGame(rng).rng).toBe(rng);
  });
});

describe("F-03 tick / softDrop（落下）", () => {
  test("F-03 tick で 1 マス下がる。盤面・スコアは変わらない", () => {
    const s = fresh();
    const n = applyAction(s, "tick");
    expect(n.active).toEqual(at("I", 3, 1));
    expect(n.board).toEqual(s.board);
    expect(n.score).toBe(0);
    expect(n.pieceCount).toBe(s.pieceCount);
  });

  test("F-06 softDrop も 1 マス下がる（tick と同じ動作）", () => {
    const s = fresh();
    expect(applyAction(s, "softDrop")).toEqual(applyAction(s, "tick"));
    expect(applyAction(s, "softDrop").active).toEqual(at("I", 3, 1));
  });

  test("F-03 元の状態を変更しない", () => {
    const s = fresh();
    const before = JSON.stringify({ ...s, rng: undefined });
    applyAction(s, "tick");
    applyAction(s, "hardDrop");
    expect(JSON.stringify({ ...s, rng: undefined })).toBe(before);
  });

  test("F-03 床の 1 つ手前（着地位置の 1 つ上）までは、固定されず下がる", () => {
    const s = withState(fresh(), { active: at("I", 3, 17) });
    const n = applyAction(s, "tick");
    expect(n.active).toEqual(at("I", 3, 18));
    expect(cellsOf(n)).toBe(0);
  });
});

describe("F-06 下に動けないとき（固定と次のミノ）", () => {
  const onFloor = () => withState(fresh(), { active: at("I", 3, 18) });

  test.each(["softDrop", "tick"] as const)("F-06 %s: 固定され、次のミノが出る", (action) => {
    const s = onFloor();
    const n = applyAction(s, action);
    expect(n.board[19]?.slice(3, 7)).toEqual(["I", "I", "I", "I"]);
    expect(cellsOf(n)).toBe(4);
    expect(n.active).toEqual(at("O", 3, 0)); // queue の先頭だったミノ
    expect(n.pieceCount).toBe(s.pieceCount + 1);
    expect(n.status).toBe("playing");
  });

  test("F-06 固定済みブロックの上でも、同様に固定される", () => {
    const board = boardOf({ 10: "...Z......" });
    const s = withState(fresh(), { board, active: at("I", 3, 8) }); // 横 I は行 9。真下の行 10 に Z
    const n = applyAction(s, "softDrop");
    expect(n.board[9]?.slice(3, 7)).toEqual(["I", "I", "I", "I"]);
  });

  test("F-11 固定後、NEXT（queue の先頭）が 1 つ進む", () => {
    const s = onFloor();
    const n = applyAction(s, "softDrop");
    expect(n.active?.type).toBe(s.queue[0]);
    expect(n.queue[0]).toBe(s.queue[1]);
  });

  test("F-02 何度固定しても、queue は 7 個以上", () => {
    let s = fresh();
    for (let i = 0; i < 6; i++) {
      s = applyAction(s, "hardDrop");
      if (s.status !== "playing") break;
      expect(s.queue.length).toBeGreaterThanOrEqual(7);
    }
  });

  test("F-02 乱数を使うのは補充のときだけ（固定を伴わない tick では使わない）", () => {
    const { rng, calls } = countingRng(0.99);
    const s = createGame(rng);
    const before = calls();
    applyAction(s, "tick");
    applyAction(s, "left");
    applyAction(s, "rotate");
    expect(calls()).toBe(before);
  });
});

describe("F-07 hardDrop", () => {
  test("F-07 空の盤面で、床まで落ちて固定され、次のミノが出る", () => {
    const s = fresh();
    const n = applyAction(s, "hardDrop");
    expect(n.board[19]?.slice(3, 7)).toEqual(["I", "I", "I", "I"]);
    expect(cellsOf(n)).toBe(4);
    expect(n.active).toEqual(at("O", 3, 0));
    expect(n.pieceCount).toBe(2);
  });

  test("F-07 固定済みブロックの上に着地する", () => {
    const board = boardOf({ 19: "...Z......" });
    const s = withState(fresh(), { board });
    const n = applyAction(s, "hardDrop");
    expect(n.board[18]?.slice(3, 7)).toEqual(["I", "I", "I", "I"]);
    expect(n.board[19]).toEqual(board[19]);
  });

  test("F-07 すでに着地位置でも、その位置で固定される", () => {
    const s = withState(fresh(), { active: at("I", 3, 18) });
    const n = applyAction(s, "hardDrop");
    expect(n.board[19]?.slice(3, 7)).toEqual(["I", "I", "I", "I"]);
    expect(n.pieceCount).toBe(s.pieceCount + 1);
  });

  test("F-07 pieceCount が 1 増える（連続 3 回で 4）", () => {
    let s = fresh();
    for (let i = 0; i < 3; i++) s = applyAction(s, "hardDrop");
    expect(s.pieceCount).toBe(4);
  });

  test("F-07 ハードドロップでの加点はない", () => {
    expect(applyAction(fresh(), "hardDrop").score).toBe(0);
  });

  test("F-07 回転・横移動した後でも、その位置で落ちる（縦 I を左端へ）", () => {
    let s = fresh();
    s = applyAction(s, "rotate"); // 縦 I は枠の列 2 → 盤の列 5
    for (let i = 0; i < 6; i++) s = applyAction(s, "left");
    const n = applyAction(s, "hardDrop");
    expect([0, 1, 2, 3].map((k) => n.board[16 + k]?.[0])).toEqual(["I", "I", "I", "I"]);
  });
});

describe("F-07/F-14 landingY / ghostPiece", () => {
  test("F-07 landingY は hardDrop の固定位置と一致する", () => {
    const board = boardOf({ 15: "..Z......." });
    const s = withState(fresh(), { board, active: at("T", 1, 0) });
    const y = landingY(board, s.active as ActivePiece);
    const n = applyAction(s, "hardDrop");
    // 固定された T の頭のマスは (x+1, y)
    expect(n.board[y]?.[2]).toBe("T");
  });

  test("F-14 ghostPiece は、active の y を着地位置にしたもの。他は同じ", () => {
    const s = fresh();
    expect(ghostPiece(s)).toEqual(at("I", 3, 18));
  });

  test("F-14 すでに着地位置なら、ゴーストは active と同じ位置", () => {
    const s = withState(fresh(), { active: at("I", 3, 18) });
    expect(ghostPiece(s)).toEqual(s.active);
  });

  test("F-12/F-14 active が null なら、ゴーストも null", () => {
    expect(ghostPiece(withState(fresh(), { active: null }))).toBeNull();
  });

  test("F-14 ghostPiece は状態を変更しない", () => {
    const s = fresh();
    ghostPiece(s);
    expect(s.active).toEqual(at("I", 3, 0));
  });
});
