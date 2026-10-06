const calc = createCalc();
const displayEl = document.getElementById("display");
const keys = document.querySelector(".keys");

function render() {
  displayEl.textContent = calc.getDisplay();
  keys.querySelectorAll("[data-op]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.op === calc.getPending());
  });
}

keys.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.dataset.num !== undefined) calc.inputNumber(btn.dataset.num);
  else if (btn.dataset.op !== undefined) calc.inputOperator(btn.dataset.op);
  else if (btn.dataset.action === "dot") calc.inputDot();
  else if (btn.dataset.action === "equals") calc.equals();
  else if (btn.dataset.action === "clear") calc.clear();

  render();
});
