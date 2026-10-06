const test = require("node:test");
const assert = require("node:assert/strict");
const { createCalc } = require("../calc.js");

const OP_KEYS = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" };

// "12+5=" のようなキー列を入力し、最後の表示を返す
function run(keys) {
  const c = createCalc();
  for (const k of keys) {
    if (/\d/.test(k)) c.inputNumber(k);
    else if (k === ".") c.inputDot();
    else if (k === "=") c.equals();
    else if (k === "C") c.clear();
    else c.inputOperator(OP_KEYS[k]);
  }
  return c.getDisplay();
}

test("初期表示は 0", () => {
  assert.equal(createCalc().getDisplay(), "0");
});

test("数字入力: 先頭の 0 は置き換わる", () => {
  assert.equal(run("007"), "7");
  assert.equal(run("123"), "123");
});

test("小数点は 1 つだけ入力できる", () => {
  assert.equal(run("1.2.3"), "1.23");
  assert.equal(run("."), "0.");
});

test("加算", () => {
  assert.equal(run("12+5="), "17");
});

test("減算（負の結果を含む）", () => {
  assert.equal(run("9-3="), "6");
  assert.equal(run("9-12="), "-3");
});

test("乗算", () => {
  assert.equal(run("6*7="), "42");
  assert.equal(run("1.5*2="), "3");
});

test("除算", () => {
  assert.equal(run("8/2="), "4");
  assert.equal(run("7/2="), "3.5");
});

test("ゼロ除算はエラー表示になる", () => {
  assert.equal(run("5/0="), "エラー");
});

test("エラー後は数字入力で復帰できる", () => {
  assert.equal(run("5/0=3"), "3");
});

test("連続計算は入力順に評価する", () => {
  assert.equal(run("1+2+3="), "6");
  assert.equal(run("1+2*3="), "9");
});

test("浮動小数点の誤差を丸める", () => {
  assert.equal(run("0.1+0.2="), "0.3");
});

test("= の後に演算子で計算結果を引き継ぐ", () => {
  assert.equal(run("2+3=*4="), "20");
});

test("クリアで初期状態に戻る", () => {
  assert.equal(run("12+5C"), "0");
  assert.equal(run("12+5C3="), "3");
});
