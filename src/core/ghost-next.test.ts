import { describe, expect, test } from "vitest";
import { createBoard, lock } from "./board";
import { applyAction, createGame, ghostPiece } from "./game";
import { peekNext } from "./bag";
import type { ActivePiece, GameState, Rng } from "./types";

function seqRng(values: readonly number[]): Rng {
  let i = 0;
  return () => {
    const v = values[i % values.length] as number;
    i++;
    return v;
  };
}

const RNG_VALUES = [0.1, 0.7, 0.3, 0.9, 0.5, 0.2, 0.8, 0.4, 0.6, 0.0];

describe("F-14 ghostPiece", () => {
  test("F-14 active が null のとき null（ゲームオーバー相当）", () => {
    const g = createGame(seqRng(RNG_VALUES));
    expect(ghostPiece({ ...g, active: null, status: "gameover" })).toBeNull();
  });

  test("F-14 空の盤面では、床に着地した位置で、種類・向き・x は元のまま", () => {
    const g = createGame(seqRng(RNG_VALUES));
    const a = g.active as ActivePiece;
    const ghost = ghostPiece(g) as ActivePiece;
    expect(ghost.type).toBe(a.type);
    expect(ghost.rotation).toBe(a.rotation);
    expect(ghost.x).toBe(a.x);
    expect(ghost.y).toBeGreaterThan(a.y);
  });

  test("F-14 着地位置が hardDrop で固定される位置と一致", () => {
    for (const type of ["I", "O", "T", "S", "Z", "J", "L"] as const) {
      for (const rotation of [0, 1, 2, 3]) {
        const g = createGame(seqRng(RNG_VALUES));
        const state: GameState = { ...g, active: { type, rotation, x: 3, y: 0 } };
        const ghost = ghostPiece(state) as ActivePiece;
        const after = applyAction(state, "hardDrop");
        expect(after.board).toEqual(lock(createBoard(), ghost));
      }
    }
  });

  test("F-14 すでに着地位置にあるミノのゴーストは同じ位置", () => {
    const g = createGame(seqRng(RNG_VALUES));
    const landed = ghostPiece(g) as ActivePiece;
    const ghost2 = ghostPiece({ ...g, active: landed });
    expect(ghost2).toEqual(landed);
  });

  test("F-14 固定済みブロックの上に着地する", () => {
    const g = createGame(seqRng(RNG_VALUES));
    // I の向き 0 は枠の行 1 が横 4 マス。y=18 で行 19 に置く
    const board = lock(createBoard(), { type: "I", rotation: 0, x: 0, y: 18 });
    const state: GameState = { ...g, board, active: { type: "I", rotation: 0, x: 0, y: 0 } };
    const ghost = ghostPiece(state) as ActivePiece;
    expect(ghost.y).toBe(17); // 行 18 に乗る
    // 列がずれていれば床まで落ちる
    const other = ghostPiece({ ...state, active: { type: "I", rotation: 0, x: 4, y: 0 } }) as ActivePiece;
    expect(other.y).toBe(18);
  });

  test("F-14 元の状態を変更しない", () => {
    const g = createGame(seqRng(RNG_VALUES));
    const before = { ...g.active } as ActivePiece;
    ghostPiece(g);
    expect(g.active).toEqual(before);
  });
});

describe("F-11 NEXT（queue の先頭）", () => {
  test("F-11 createGame 直後、queue は 7 個以上で、queue[0] は次に出るミノ", () => {
    const g = createGame(seqRng(RNG_VALUES));
    expect(g.queue.length).toBeGreaterThanOrEqual(7);
    expect(peekNext(g.queue)).toBe(g.queue[0]);
    const after = applyAction(g, "hardDrop");
    expect(after.active?.type).toBe(g.queue[0]);
  });

  test("F-11 hardDrop の後、新しい queue[0] が次の次に出るミノと一致し、先頭は 1 つ進む", () => {
    const g = createGame(seqRng(RNG_VALUES));
    const g2 = applyAction(g, "hardDrop");
    expect(g2.queue.length).toBeGreaterThanOrEqual(7);
    expect(g2.queue.slice(0, 6)).toEqual(g.queue.slice(1, 7));
    const g3 = applyAction(g2, "hardDrop");
    expect(g3.active?.type).toBe(peekNext(g2.queue));
  });

  test("F-11 何度ハードドロップしても queue は常に 7 個以上（ゲームオーバーまで）", () => {
    let g = createGame(seqRng(RNG_VALUES));
    for (let i = 0; i < 30 && g.status === "playing"; i++) {
      const expected = peekNext(g.queue);
      g = applyAction(g, "hardDrop");
      expect(g.queue.length).toBeGreaterThanOrEqual(7);
      if (g.active !== null) expect(g.active.type).toBe(expected);
    }
    expect(g.status).toBe("gameover");
  });

  test("F-11 peekNext は取り出さない・空なら undefined", () => {
    const g = createGame(seqRng(RNG_VALUES));
    const q = [...g.queue];
    peekNext(g.queue);
    expect(g.queue).toEqual(q);
    expect(peekNext([])).toBeUndefined();
  });
});
