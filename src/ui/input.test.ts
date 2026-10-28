import { describe, expect, test } from "vitest";
import type { Action } from "../core/types";
import { actionOfButton, isRepeatable, keyToAction } from "./input";

const ALL: Action[] = ["left", "right", "rotate", "softDrop", "hardDrop", "tick", "togglePause", "restart"];
const INHERITED = ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"];

describe("F-15 keyToAction", () => {
  test.each([
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
    ["ArrowUp", "rotate"],
    ["ArrowDown", "softDrop"],
    ["Space", "hardDrop"],
    ["KeyP", "togglePause"],
    ["KeyR", "restart"],
  ])("F-15 %s は %s", (code, action) => {
    expect(keyToAction(code)).toBe(action);
  });

  test.each(["KeyA", "Enter", "Escape", "arrowleft", " ", "Space ", "Key P"])("F-15 未知のキー %j は null", (code) => {
    expect(keyToAction(code)).toBeNull();
  });

  test("F-15 空文字は null", () => {
    expect(keyToAction("")).toBeNull();
  });

  test.each(INHERITED)("F-15 継承プロパティ名 %s は null", (code) => {
    expect(keyToAction(code)).toBeNull();
  });
});

describe("F-15 isRepeatable", () => {
  test.each(["left", "right", "softDrop"] as Action[])("F-15 %s は繰り返す", (a) => {
    expect(isRepeatable(a)).toBe(true);
  });

  test.each(ALL.filter((a) => !["left", "right", "softDrop"].includes(a)))("F-15 %s は繰り返さない", (a) => {
    expect(isRepeatable(a)).toBe(false);
  });
});

describe("F-16 actionOfButton", () => {
  test.each(["left", "right", "rotate", "softDrop", "hardDrop", "togglePause", "restart"] as Action[])(
    "F-16 data-action=%s は同名の操作",
    (a) => {
      expect(actionOfButton(a)).toBe(a);
    },
  );

  test.each(["", "Left", "tick", "jump", " left"])("F-16 未知の文字列 %j は null", (s) => {
    expect(actionOfButton(s)).toBeNull();
  });

  test("F-16 null と undefined は null", () => {
    expect(actionOfButton(null)).toBeNull();
    expect(actionOfButton(undefined)).toBeNull();
  });

  test.each(INHERITED)("F-16 継承プロパティ名 %s は null", (s) => {
    expect(actionOfButton(s)).toBeNull();
  });
});

describe("F-17 入力の割り当て（一時停止・リスタート）", () => {
  test("F-17 KeyP とボタンは togglePause、KeyR とボタンは restart", () => {
    expect(keyToAction("KeyP")).toBe("togglePause");
    expect(actionOfButton("togglePause")).toBe("togglePause");
    expect(keyToAction("KeyR")).toBe("restart");
    expect(actionOfButton("restart")).toBe("restart");
  });
});
