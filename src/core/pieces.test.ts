import { describe, expect, test } from "vitest";
import { getCells } from "./pieces";
import { PIECE_TYPES } from "./types";

const key = (cells: readonly (readonly [number, number])[]) =>
  cells.map(([c, r]) => `${c},${r}`).sort();

describe("F-05 getCells: 形と向き", () => {
  test("F-05 7種・4向きのすべてで、占めるマスは重複のない4件", () => {
    for (const type of PIECE_TYPES) {
      for (let rot = 0; rot < 4; rot++) {
        const cells = getCells(type, rot);
        expect(cells).toHaveLength(4);
        expect(new Set(key(cells)).size).toBe(4);
      }
    }
  });

  test("F-05 マスは、I は 4x4、それ以外は 3x3 の枠の内側に収まる", () => {
    for (const type of PIECE_TYPES) {
      const n = type === "I" || type === "O" ? 4 : 3;
      for (let rot = 0; rot < 4; rot++) {
        for (const [c, r] of getCells(type, rot)) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThan(n);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThan(n);
        }
      }
    }
  });

  test("F-05 向き 0 の基本形（設計書の行列）", () => {
    expect(key(getCells("I", 0))).toEqual(key([[0, 1], [1, 1], [2, 1], [3, 1]]));
    expect(key(getCells("O", 0))).toEqual(key([[1, 0], [2, 0], [1, 1], [2, 1]]));
    expect(key(getCells("T", 0))).toEqual(key([[1, 0], [0, 1], [1, 1], [2, 1]]));
    expect(key(getCells("S", 0))).toEqual(key([[1, 0], [2, 0], [0, 1], [1, 1]]));
    expect(key(getCells("Z", 0))).toEqual(key([[0, 0], [1, 0], [1, 1], [2, 1]]));
    expect(key(getCells("J", 0))).toEqual(key([[0, 0], [0, 1], [1, 1], [2, 1]]));
    expect(key(getCells("L", 0))).toEqual(key([[2, 0], [0, 1], [1, 1], [2, 1]]));
  });

  test("F-05 O は、4つの向きとも同じ形", () => {
    for (let rot = 1; rot < 4; rot++) {
      expect(getCells("O", rot)).toEqual(getCells("O", 0));
    }
  });

  test("F-05 I の向き 1 は、枠の列 2 の縦 1 列", () => {
    expect(key(getCells("I", 1))).toEqual(key([[2, 0], [2, 1], [2, 2], [2, 3]]));
  });

  test("F-05 I の向き 2・3 は、行 2・列 1", () => {
    expect(key(getCells("I", 2))).toEqual(key([[0, 2], [1, 2], [2, 2], [3, 2]]));
    expect(key(getCells("I", 3))).toEqual(key([[1, 0], [1, 1], [1, 2], [1, 3]]));
  });

  test("F-05 T の4つの向き（時計回り）", () => {
    expect(key(getCells("T", 1))).toEqual(key([[1, 0], [1, 1], [2, 1], [1, 2]]));
    expect(key(getCells("T", 2))).toEqual(key([[0, 1], [1, 1], [2, 1], [1, 2]]));
    expect(key(getCells("T", 3))).toEqual(key([[1, 0], [0, 1], [1, 1], [1, 2]]));
  });

  test("F-05 S の向き 1（時計回りの縦形）", () => {
    expect(key(getCells("S", 1))).toEqual(key([[1, 0], [1, 1], [2, 1], [2, 2]]));
  });

  test("F-05 向き 4 は向き 0 と同じ（境界: 4 で一周）", () => {
    for (const type of PIECE_TYPES) {
      expect(getCells(type, 4)).toEqual(getCells(type, 0));
    }
  });

  test("F-05 O 以外は、向き 0 と 1 で形が異なる", () => {
    for (const type of PIECE_TYPES) {
      if (type === "O") continue;
      expect(key(getCells(type, 1))).not.toEqual(key(getCells(type, 0)));
    }
  });
});
