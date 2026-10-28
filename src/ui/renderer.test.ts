import { describe, expect, test } from "vitest";
import { computeCellSize, isViewportSupported } from "./renderer";

describe("F-16 isViewportSupported", () => {
  test("F-16 639 は非対応、640 は対応（境界）", () => {
    expect(isViewportSupported(639)).toBe(false);
    expect(isViewportSupported(640)).toBe(true);
    expect(isViewportSupported(641)).toBe(true);
  });
  test("F-16 0 と負の値は非対応", () => {
    expect(isViewportSupported(0)).toBe(false);
    expect(isViewportSupported(-1)).toBe(false);
    expect(isViewportSupported(-1000)).toBe(false);
  });
  test("F-16 非常に大きい値は対応", () => {
    expect(isViewportSupported(100000)).toBe(true);
    expect(isViewportSupported(Number.MAX_SAFE_INTEGER)).toBe(true);
  });
});

describe("F-16 computeCellSize", () => {
  test("F-16 vh=640 で十分広い vw ならマス 18", () => {
    expect(computeCellSize(1000, 640)).toBe(18);
    expect(computeCellSize(196, 640)).toBe(18); // 幅の境界: floor((196-16)/10)=18
  });
  test("F-16 vh>=640 ならマスは 18 以上", () => {
    for (const vh of [640, 700, 800, 1000]) {
      expect(computeCellSize(2000, vh)).toBeGreaterThanOrEqual(18);
    }
  });
  test("F-16 下限 12", () => {
    expect(computeCellSize(1000, 0)).toBe(12);
    expect(computeCellSize(1000, -500)).toBe(12);
    expect(computeCellSize(0, 0)).toBe(12);
    expect(computeCellSize(1000, 264 + 20 * 12)).toBe(12);
    expect(computeCellSize(1000, 264 + 20 * 13 - 1)).toBe(12);
  });
  test("F-16 上限 32", () => {
    expect(computeCellSize(5000, 5000)).toBe(32);
    expect(computeCellSize(5000, 264 + 20 * 32)).toBe(32);
    expect(computeCellSize(5000, 264 + 20 * 33)).toBe(32);
  });
  test("F-16 高さで決まる（途中の値）", () => {
    expect(computeCellSize(5000, 264 + 20 * 20)).toBe(20);
    expect(computeCellSize(5000, 264 + 20 * 20 - 1)).toBe(19);
  });
  test("F-16 幅が狭いときは幅で決まる", () => {
    expect(computeCellSize(250, 2000)).toBe(23); // floor(234/10)
    expect(computeCellSize(200, 2000)).toBe(18);
    expect(computeCellSize(100, 2000)).toBe(12); // 幅が極端に狭くても下限
  });
  test("F-16 返り値は整数で 12〜32", () => {
    for (const vw of [0, 99, 321.7, 375, 390, 1024, 4000]) {
      for (const vh of [-1, 300, 640, 667.5, 812, 1080, 3000]) {
        const s = computeCellSize(vw, vh);
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(12);
        expect(s).toBeLessThanOrEqual(32);
      }
    }
  });
});
