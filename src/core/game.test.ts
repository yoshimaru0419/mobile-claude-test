import { describe, expect, test } from "vitest";
import { createBoard, landingY } from "./board";
import { applyAction, createGame, dropInterval, ghostPiece, levelOf } from "./game";
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

/**
 * 盤面の列 9 だけを空けた行を n 行（下から）作り、縦 I（向き 1, x=7 → 列 9）で埋める状態。
 * 縦 I は行 16〜19 の列 9 を埋めるので、下から n 行が消える（n = 0〜4）。
 */
function readyToClear(n: number, patch: Partial<GameState> = {}): GameState {
  const rows: Record<number, string> = {};
  for (let r = 20 - n; r < 20; r++) rows[r] = "ZZZZZZZZZ.";
  return withState(fresh(), { board: boardOf(rows), active: at("I", 7, 16, 1), ...patch });
}

describe("F-09 スコア", () => {
  test.each([
    [1, 100],
    [2, 200],
    [3, 300],
    [4, 400],
  ])("F-09 %i 行消去で %i 点", (n, points) => {
    const next = applyAction(readyToClear(n), "hardDrop");
    expect(next.score).toBe(points);
    expect(next.lines).toBe(n);
  });

  test("F-09 0 行（行が埋まらない）なら加点なし", () => {
    const next = applyAction(readyToClear(0), "hardDrop");
    expect(next.score).toBe(0);
    expect(next.lines).toBe(0);
  });

  test("F-09 既存のスコアに加算される", () => {
    const next = applyAction(readyToClear(2, { score: 250 }), "hardDrop");
    expect(next.score).toBe(450);
  });

  test("F-09 tick / softDrop で床に着いて消えた場合も同じ加点", () => {
    const s = readyToClear(1, { active: at("I", 7, 16, 1) });
    expect(applyAction(s, "softDrop").score).toBe(100);
    expect(applyAction(s, "tick").score).toBe(100);
  });

  test("F-09 ドロップ自体での加点はない（ソフト・ハードとも）", () => {
    expect(applyAction(fresh(), "softDrop").score).toBe(0);
    expect(applyAction(readyToClear(0), "hardDrop").score).toBe(0);
  });
});

describe("F-08 消去と詰まり（game 経由）", () => {
  test("F-08 4 行同時消去: 上にあった固定ブロックが 4 段下に詰まる", () => {
    const s = readyToClear(4);
    const withMarker = withState(s, {
      board: boardOf({
        15: "T.........",
        16: "ZZZZZZZZZ.",
        17: "ZZZZZZZZZ.",
        18: "ZZZZZZZZZ.",
        19: "ZZZZZZZZZ.",
      }),
    });
    const n = applyAction(withMarker, "hardDrop");
    expect(n.board[19]?.[0]).toBe("T");
    expect(n.board.flat().filter((c) => c !== null)).toHaveLength(1);
  });

  test("F-08 消えなかった行のブロックは残る（1 行消去で、上の行が 1 段下がる）", () => {
    const base = readyToClear(1);
    const s = withState(base, { board: boardOf({ 18: "S.........", 19: "ZZZZZZZZZ." }) });
    const n = applyAction(s, "hardDrop");
    expect(n.board[19]?.[0]).toBe("S");
    // 縦 I の残り 3 マス（行 16〜18 の列 9）は 1 段下がって行 17〜19
    expect([17, 18].map((r) => n.board[r]?.[9])).toEqual(["I", "I"]);
    expect(n.board[19]?.[9]).toBe("I");
  });
});

describe("F-10 levelOf / dropInterval", () => {
  test("F-10 lines 0〜9 はレベル 1、10 でレベル 2（境界）", () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(9)).toBe(1);
    expect(levelOf(10)).toBe(2);
    expect(levelOf(19)).toBe(2);
    expect(levelOf(20)).toBe(3);
    expect(levelOf(13)).toBe(2);
  });

  test("F-10 レベル 1 = 1000ms、2 = 900ms、10 以上 = 100ms", () => {
    expect(dropInterval(1)).toBe(1000);
    expect(dropInterval(2)).toBe(900);
    expect(dropInterval(9)).toBe(200);
    expect(dropInterval(10)).toBe(100);
    expect(dropInterval(11)).toBe(100);
  });

  test("F-10 非常に大きいレベルでも 100ms（下限）", () => {
    expect(dropInterval(1000)).toBe(100);
    expect(dropInterval(Number.MAX_SAFE_INTEGER)).toBe(100);
  });

  test("F-10 累計 9 行から 1 行消去: lines 10、レベル 2、間隔 900ms", () => {
    const n = applyAction(readyToClear(1, { lines: 9 }), "hardDrop");
    expect(n.lines).toBe(10);
    expect(levelOf(n.lines)).toBe(2);
    expect(dropInterval(levelOf(n.lines))).toBe(900);
  });

  test("F-10 累計 9 行から 4 行消去: lines 13、レベル 2", () => {
    const n = applyAction(readyToClear(4, { lines: 9 }), "hardDrop");
    expect(n.lines).toBe(13);
    expect(levelOf(n.lines)).toBe(2);
  });

  test("F-10 消去 0 行なら lines は増えず、レベルは変わらない", () => {
    const n = applyAction(readyToClear(0, { lines: 9 }), "hardDrop");
    expect(n.lines).toBe(9);
    expect(levelOf(n.lines)).toBe(1);
  });
});

describe("F-12 ゲームオーバー", () => {
  /** 固定後に I が出る（queue 先頭 I）。出現位置（行 1・列 3〜6）の列 4 が埋まっている。 */
  const aboutToOverflow = () =>
    withState(fresh(), {
      board: boardOf({ 1: "....Z....." }),
      active: at("T", 0, 10),
      queue: ["I", "O", "T", "S", "Z", "J", "L"],
    });

  test("F-12 次のミノの出現位置が埋まっていると、gameover で active は null", () => {
    const n = applyAction(aboutToOverflow(), "hardDrop");
    expect(n.status).toBe("gameover");
    expect(n.active).toBeNull();
  });

  test("F-12 gameover 後、left/right/rotate/softDrop/hardDrop/tick は状態を変えない", () => {
    const over = applyAction(aboutToOverflow(), "hardDrop");
    for (const a of ["left", "right", "rotate", "softDrop", "hardDrop", "tick"] as const) {
      expect(applyAction(over, a)).toEqual(over);
    }
  });

  test("F-12 gameover でゴーストを求めると null", () => {
    expect(ghostPiece(applyAction(aboutToOverflow(), "hardDrop"))).toBeNull();
  });

  test("F-12 枠の空きマスだけが埋まっていても、ゲームオーバーにならない（実マスで判定）", () => {
    // O は 4×4 の枠の (1,0),(2,0),(1,1),(2,1) → 盤の列 4,5。列 3 は枠内でもミノのマスではない
    const s = withState(fresh(), {
      board: boardOf({ 0: "...Z......", 1: "...Z......" }),
      active: at("T", 7, 10),
      queue: ["O", "I", "T", "S", "Z", "J", "L"],
    });
    const n = applyAction(s, "hardDrop");
    expect(n.status).toBe("playing");
    expect(n.active).toEqual(at("O", 3, 0));
  });

  test("F-12 実マスが 1 つだけ重なる境界でも、ゲームオーバー", () => {
    const s = withState(fresh(), {
      board: boardOf({ 1: ".....Z...." }),
      active: at("T", 0, 10),
      queue: ["O", "I", "T", "S", "Z", "J", "L"],
    });
    expect(applyAction(s, "hardDrop").status).toBe("gameover");
  });

  test("F-12 ゲームオーバー時もスコアと盤面は保持される", () => {
    const over = applyAction(aboutToOverflow(), "hardDrop");
    expect(over.board[1]?.[4]).toBe("Z");
    expect(over.board.flat().filter((c) => c === "T")).toHaveLength(4);
  });
});

describe("F-13 restart", () => {
  const played = () => {
    let s = applyAction(readyToClear(2), "hardDrop");
    s = applyAction(s, "hardDrop");
    return s;
  };

  test("F-13 盤面・スコア・lines・status が初期化される", () => {
    const s = played();
    expect(s.score).toBeGreaterThan(0);
    const n = applyAction(s, "restart");
    expect(n.board).toEqual(createBoard());
    expect(cellsOf(n)).toBe(0);
    expect(n.score).toBe(0);
    expect(n.lines).toBe(0);
    expect(levelOf(n.lines)).toBe(1);
    expect(n.status).toBe("playing");
    expect(n.active).not.toBeNull();
    expect(n.pieceCount).toBe(1);
  });

  test("F-13 ゲームオーバー後でも、restart で playing に戻る", () => {
    const over = applyAction(
      withState(fresh(), {
        board: boardOf({ 1: "....Z....." }),
        active: at("T", 0, 10),
        queue: ["I", "O", "T", "S", "Z", "J", "L"],
        score: 700,
        lines: 12,
      }),
      "hardDrop",
    );
    expect(over.status).toBe("gameover");
    const n = applyAction(over, "restart");
    expect(n.status).toBe("playing");
    expect(n.score).toBe(0);
    expect(n.lines).toBe(0);
    expect(cellsOf(n)).toBe(0);
    expect(n.active).not.toBeNull();
  });

  test("F-13 同じ乱数関数を使い続ける（乱数の続きから）", () => {
    const s = fresh();
    expect(applyAction(s, "restart").rng).toBe(s.rng);
  });

  test("F-13 playing 中の restart でも、初期化される", () => {
    const n = applyAction(readyToClear(1, { score: 900, lines: 3 }), "restart");
    expect(n.score).toBe(0);
    expect(n.lines).toBe(0);
    expect(cellsOf(n)).toBe(0);
  });
});

describe("F-17 一時停止", () => {
  test("F-17 playing ⇄ paused を往復できる", () => {
    const s = fresh();
    const p = applyAction(s, "togglePause");
    expect(p.status).toBe("paused");
    expect(applyAction(p, "togglePause").status).toBe("playing");
  });

  test("F-17 一時停止・再開で、盤面・active・スコアは変わらない", () => {
    const s = applyAction(fresh(), "tick");
    const back = applyAction(applyAction(s, "togglePause"), "togglePause");
    expect(back).toEqual(s);
  });

  test("F-17 paused では left/right/rotate/softDrop/hardDrop/tick が状態を変えない", () => {
    const p = applyAction(applyAction(fresh(), "tick"), "togglePause");
    for (const a of ["left", "right", "rotate", "softDrop", "hardDrop", "tick"] as const) {
      expect(applyAction(p, a)).toEqual(p);
    }
  });

  test("F-13/F-17 paused でも restart できて、playing になる", () => {
    const p = applyAction(readyToClear(1, { score: 300 }), "togglePause");
    expect(p.status).toBe("paused");
    const n = applyAction(p, "restart");
    expect(n.status).toBe("playing");
    expect(n.score).toBe(0);
  });

  test("F-17 gameover では togglePause は何もしない", () => {
    const over = applyAction(
      withState(fresh(), {
        board: boardOf({ 1: "....Z....." }),
        active: at("T", 0, 10),
        queue: ["I", "O", "T", "S", "Z", "J", "L"],
      }),
      "hardDrop",
    );
    expect(over.status).toBe("gameover");
    expect(applyAction(over, "togglePause")).toEqual(over);
  });

  test("F-17 再開後は、操作がまた効く", () => {
    const resumed = applyAction(applyAction(fresh(), "togglePause"), "togglePause");
    expect(applyAction(resumed, "tick").active).toEqual(at("I", 3, 1));
  });
});

describe("F-04/F-05 左右移動・回転（game 経由、playing）", () => {
  test("F-04 left/right で 1 列動く。左端では動かない", () => {
    let s = fresh();
    expect(applyAction(s, "right").active?.x).toBe(4);
    for (let i = 0; i < 10; i++) s = applyAction(s, "left");
    expect(s.active?.x).toBe(0);
  });

  test("F-05 rotate で向きが 1 になる", () => {
    expect(applyAction(fresh(), "rotate").active?.rotation).toBe(1);
  });
});
