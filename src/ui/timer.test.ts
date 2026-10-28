import { describe, expect, test } from "vitest";
import { dropInterval } from "../core/game";
import { MAX_DT, stepTimer } from "./timer";

describe("F-03 stepTimer 基本", () => {
  test("F-03 間隔未満は tick なしで蓄積", () => {
    expect(stepTimer(0, 100, "playing", 1)).toEqual({ acc: 100, tick: false });
    expect(stepTimer(899, 100, "playing", 1)).toEqual({ acc: 999, tick: false });
  });
  test("F-03 間隔ちょうどで tick し、余りは 0", () => {
    expect(stepTimer(900, 100, "playing", 1)).toEqual({ acc: 0, tick: true });
  });
  test("F-03 間隔以上で tick し、余りを持ち越す", () => {
    expect(stepTimer(900, 250, "playing", 1)).toEqual({ acc: 150, tick: true });
  });
  test("F-03 dt=0 でも蓄積が間隔以上なら tick", () => {
    expect(stepTimer(1000, 0, "playing", 1)).toEqual({ acc: 0, tick: true });
  });
  test("F-03 dt は 250 に切り詰める", () => {
    expect(MAX_DT).toBe(250);
    expect(stepTimer(0, 10000, "playing", 1)).toEqual({ acc: 250, tick: false });
    expect(stepTimer(0, 251, "playing", 1)).toEqual({ acc: 250, tick: false });
    expect(stepTimer(0, 250, "playing", 1)).toEqual({ acc: 250, tick: false });
  });
  test("F-03 負の dt は 0 として扱う（acc は減らない）", () => {
    expect(stepTimer(500, -100, "playing", 1)).toEqual({ acc: 500, tick: false });
    expect(stepTimer(1000, -5, "playing", 1)).toEqual({ acc: 0, tick: true });
  });
});

describe("F-03 / F-10 余りの扱い", () => {
  test("F-10 蓄積が間隔の 2 倍以上でも tick は 1 回、余りは剰余", () => {
    expect(stepTimer(2500, 0, "playing", 1)).toEqual({ acc: 500, tick: true });
    expect(stepTimer(2000, 0, "playing", 1)).toEqual({ acc: 0, tick: true });
    expect(stepTimer(3999, 0, "playing", 1)).toEqual({ acc: 999, tick: true });
  });
  test("F-10 level による間隔の違い", () => {
    expect(dropInterval(1)).toBe(1000);
    expect(stepTimer(0, 250, "playing", 1).tick).toBe(false);
    // level 2 は 900ms
    expect(stepTimer(650, 250, "playing", 2)).toEqual({ acc: 0, tick: true });
    expect(stepTimer(650, 249, "playing", 2)).toEqual({ acc: 899, tick: false });
    // level 1 では同じ入力でも tick しない
    expect(stepTimer(650, 250, "playing", 1)).toEqual({ acc: 900, tick: false });
  });
  test("F-10 level 10 以上は 100ms のまま", () => {
    expect(stepTimer(0, 100, "playing", 10)).toEqual({ acc: 0, tick: true });
    expect(stepTimer(0, 100, "playing", 30)).toEqual({ acc: 0, tick: true });
    expect(stepTimer(0, 99, "playing", 30)).toEqual({ acc: 99, tick: false });
    expect(stepTimer(0, 250, "playing", 10)).toEqual({ acc: 50, tick: true });
  });
});

describe("F-17 stepTimer 一時停止・ゲームオーバー", () => {
  test.each(["paused", "gameover"] as const)("F-17 %s は acc 不変で tick なし", (status) => {
    expect(stepTimer(123, 250, status, 1)).toEqual({ acc: 123, tick: false });
    expect(stepTimer(5000, 250, status, 1)).toEqual({ acc: 5000, tick: false });
    expect(stepTimer(0, 100, status, 10)).toEqual({ acc: 0, tick: false });
  });
  test("F-17 再開直後（acc=0）はすぐに落ちない", () => {
    expect(stepTimer(0, 16, "playing", 1).tick).toBe(false);
  });
});
