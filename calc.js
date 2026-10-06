// 電卓のロジック。DOM には触れない。
// 演算は OPERATORS に登録する（加算・減算・乗算・除算は各コミットで追加）。
const OPERATORS = {};

OPERATORS.multiply = {
  fn: (a, b) => a * b,
};

OPERATORS.subtract = {
  fn: (a, b) => a - b,
};

OPERATORS.add = {
  fn: (a, b) => a + b,
};

const ERROR = "エラー";

function createCalc() {
  let display = "0";
  let acc = null;       // 直前までの計算結果
  let pending = null;   // 待機中の演算子キー
  let fresh = true;     // 次の数字入力で表示を置き換えるか

  const isError = () => display === ERROR;

  function format(n) {
    return String(Number(n.toPrecision(12)));
  }

  function inputNumber(d) {
    if (isError()) clear();
    display = fresh || display === "0" ? d : display + d;
    fresh = false;
  }

  function inputDot() {
    if (isError()) clear();
    if (fresh) {
      display = "0.";
      fresh = false;
    } else if (!display.includes(".")) {
      display += ".";
    }
  }

  function applyPending() {
    if (pending === null) return;
    const result = OPERATORS[pending].fn(acc, Number(display));
    if (result === null) {
      display = ERROR;
      acc = null;
      pending = null;
    } else {
      display = format(result);
    }
  }

  function inputOperator(key) {
    if (isError()) return;
    if (pending !== null && !fresh) applyPending();
    if (isError()) { fresh = true; return; }
    acc = Number(display);
    pending = key;
    fresh = true;
  }

  function equals() {
    if (isError() || pending === null) return;
    applyPending();
    acc = null;
    pending = null;
    fresh = true;
  }

  function clear() {
    display = "0";
    acc = null;
    pending = null;
    fresh = true;
  }

  return {
    inputNumber, inputDot, inputOperator, equals, clear,
    getDisplay: () => display,
    getPending: () => pending,
  };
}

if (typeof module !== "undefined") module.exports = { createCalc, OPERATORS };
