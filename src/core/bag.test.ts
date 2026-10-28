import { describe, expect, test } from "vitest";
import { ensureQueue, peekNext, shuffledBag, takeNext } from "./bag";
import { countingRng, identityRng, seqRng } from "./test-utils";
import { PIECE_TYPES, type PieceType } from "./types";

const sorted = (xs: readonly PieceType[]) => [...xs].sort();
const ALL = sorted(PIECE_TYPES);

describe("F-02 shuffledBag", () => {
  test("F-02 7 種を 1 個ずつ含む", () => {
    expect(sorted(shuffledBag(seqRng([0.1, 0.5, 0.9])))).toEqual(ALL);
  });

  test("F-02 乱数が常に 0.99 なら入れ替えが起きず、I, O, T, S, Z, J, L の順", () => {
    expect(shuffledBag(identityRng)).toEqual(["I", "O", "T", "S", "Z", "J", "L"]);
  });

  test("F-02 乱数が常に 0 なら、設計書の Fisher-Yates の手順どおりの順（O, T, S, Z, J, L, I）", () => {
    expect(shuffledBag(() => 0)).toEqual(["O", "T", "S", "Z", "J", "L", "I"]);
  });

  test("F-02 乱数を 6 回だけ使う（i = 6 から 1）", () => {
    const { rng, calls } = countingRng(0.3);
    shuffledBag(rng);
    expect(calls()).toBe(6);
  });

  test("F-02 同じ乱数列を注入すると、同じ順序になる", () => {
    const seq = [0.12, 0.83, 0.47, 0.05, 0.66, 0.31];
    expect(shuffledBag(seqRng(seq))).toEqual(shuffledBag(seqRng(seq)));
  });

  test("F-02 異なる乱数列では、順序が変わりうる", () => {
    expect(shuffledBag(identityRng)).not.toEqual(shuffledBag(() => 0));
  });

  test("F-02 境界: 乱数が 0 以上 1 未満の端（0 と 0.999999）でも 7 種になる", () => {
    expect(sorted(shuffledBag(() => 0))).toEqual(ALL);
    expect(sorted(shuffledBag(() => 0.999999))).toEqual(ALL);
  });
});

describe("F-02 ensureQueue", () => {
  test("F-02 空の queue から 7 個以上に補充する", () => {
    const q = ensureQueue([], seqRng([0.2, 0.7]));
    expect(q.length).toBeGreaterThanOrEqual(7);
    expect(sorted(q.slice(0, 7))).toEqual(ALL);
  });

  test("F-02 0〜6 個の queue は、先頭を保ったまま 7 個以上になる", () => {
    for (let n = 0; n <= 6; n++) {
      const base = PIECE_TYPES.slice(0, n);
      const q = ensureQueue(base, seqRng([0.4, 0.9, 0.1]));
      expect(q.length).toBeGreaterThanOrEqual(7);
      expect(q.slice(0, n)).toEqual(base);
    }
  });

  test("F-02 7 個以上なら、乱数を使わず、そのまま返す", () => {
    const { rng, calls } = countingRng(0.5);
    const base: PieceType[] = [...PIECE_TYPES];
    expect(ensureQueue(base, rng)).toEqual(base);
    expect(calls()).toBe(0);
  });

  test("F-02 元の queue を変更しない", () => {
    const base: PieceType[] = ["I", "O"];
    ensureQueue(base, identityRng);
    expect(base).toEqual(["I", "O"]);
  });
});

describe("F-02 takeNext", () => {
  test("F-02 先頭を取り出し、残りの先頭が次になる", () => {
    const q: PieceType[] = ["T", "S", "Z", "J", "L", "I", "O"];
    const r = takeNext(q, identityRng);
    expect(r.type).toBe("T");
    expect(r.queue.slice(0, 6)).toEqual(["S", "Z", "J", "L", "I", "O"]);
  });

  test("F-02 取り出した後も、queue は常に 7 個以上", () => {
    let q: readonly PieceType[] = ensureQueue([], seqRng([0.3, 0.6, 0.9]));
    const rng = seqRng([0.3, 0.6, 0.9, 0.15]);
    for (let i = 0; i < 100; i++) {
      q = takeNext(q, rng).queue;
      expect(q.length).toBeGreaterThanOrEqual(7);
    }
  });

  test("F-02 最初の 7 個と次の 7 個が、それぞれ 7 種を 1 個ずつ含む（14 個）", () => {
    const rng = seqRng([0.71, 0.13, 0.52, 0.94, 0.28, 0.05, 0.6, 0.39]);
    let q: readonly PieceType[] = ensureQueue([], rng);
    const out: PieceType[] = [];
    for (let i = 0; i < 14; i++) {
      const r = takeNext(q, rng);
      out.push(r.type);
      q = r.queue;
    }
    expect(sorted(out.slice(0, 7))).toEqual(ALL);
    expect(sorted(out.slice(7, 14))).toEqual(ALL);
  });

  test("F-02 同じ乱数列を注入すると、14 個とも同じ順序", () => {
    const run = () => {
      const rng = seqRng([0.71, 0.13, 0.52, 0.94, 0.28]);
      let q: readonly PieceType[] = ensureQueue([], rng);
      const out: PieceType[] = [];
      for (let i = 0; i < 14; i++) {
        const r = takeNext(q, rng);
        out.push(r.type);
        q = r.queue;
      }
      return out;
    };
    expect(run()).toEqual(run());
  });

  test("F-02 queue が空でも取り出せる（補充してから取る）", () => {
    const r = takeNext([], identityRng);
    expect(r.type).toBe("I");
    expect(r.queue.length).toBeGreaterThanOrEqual(7);
  });

  test("F-02 元の queue を変更しない", () => {
    const q: PieceType[] = ["T", "S", "Z", "J", "L", "I", "O"];
    takeNext(q, identityRng);
    expect(q).toEqual(["T", "S", "Z", "J", "L", "I", "O"]);
  });
});

describe("F-11 peekNext", () => {
  test("F-11 先頭を返し、queue から取り出さない", () => {
    const q: PieceType[] = ["J", "L", "I"];
    expect(peekNext(q)).toBe("J");
    expect(peekNext(q)).toBe("J");
    expect(q).toEqual(["J", "L", "I"]);
  });

  test("F-11 空の queue では undefined", () => {
    expect(peekNext([])).toBeUndefined();
  });

  test("F-11 peekNext の値が、次に takeNext で出る種類と一致する", () => {
    const q = ensureQueue([], seqRng([0.4, 0.8, 0.2]));
    expect(takeNext(q, identityRng).type).toBe(peekNext(q));
  });
});
