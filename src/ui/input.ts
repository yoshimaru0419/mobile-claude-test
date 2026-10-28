import type { Action } from "../core/types";

/** キーの対応表（event.code で判定）。表にないキーは無視する。 */
const KEY_MAP: Readonly<Record<string, Action>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "rotate",
  ArrowDown: "softDrop",
  Space: "hardDrop",
  KeyP: "togglePause",
  KeyR: "restart",
};

/** ボタンの data-action 属性の対応表。 */
const BUTTON_MAP: Readonly<Record<string, Action>> = {
  left: "left",
  right: "right",
  rotate: "rotate",
  softDrop: "softDrop",
  hardDrop: "hardDrop",
  togglePause: "togglePause",
  restart: "restart",
};

/** ボタンを押し続けたときの、繰り返しの開始までの時間と、間隔（ミリ秒）。 */
const REPEAT_DELAY = 200;
const REPEAT_INTERVAL = 80;

export function keyToAction(code: string): Action | null {
  return Object.hasOwn(KEY_MAP, code) ? (KEY_MAP[code] ?? null) : null;
}

export function actionOfButton(dataAction: string | null | undefined): Action | null {
  if (dataAction === null || dataAction === undefined) return null;
  return Object.hasOwn(BUTTON_MAP, dataAction) ? (BUTTON_MAP[dataAction] ?? null) : null;
}

/** 押し続けると繰り返す操作は、左・右・ソフトドロップだけ。 */
export function isRepeatable(action: Action): boolean {
  return action === "left" || action === "right" || action === "softDrop";
}

/** キーボードと画面上ボタンの入力を登録する。解除する関数を返す。 */
export function attachInput(doc: Document, onAction: (action: Action) => void): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    const action = keyToAction(event.code);
    if (action === null) return;
    event.preventDefault(); // ページのスクロールなどの既定の動作を止める
    if (event.repeat && !isRepeatable(action)) return;
    onAction(action);
  };
  doc.addEventListener("keydown", onKeyDown);

  const cleanups: (() => void)[] = [];

  for (const button of doc.querySelectorAll<HTMLElement>("[data-action]")) {
    const action = actionOfButton(button.dataset["action"]);
    if (action === null) continue;

    let delay: ReturnType<typeof setTimeout> | undefined;
    let repeat: ReturnType<typeof setInterval> | undefined;

    const stop = (): void => {
      if (delay !== undefined) clearTimeout(delay);
      if (repeat !== undefined) clearInterval(repeat);
      delay = undefined;
      repeat = undefined;
    };
    const onDown = (event: PointerEvent): void => {
      event.preventDefault();
      stop();
      onAction(action);
      if (!isRepeatable(action)) return;
      delay = setTimeout(() => {
        repeat = setInterval(() => onAction(action), REPEAT_INTERVAL);
      }, REPEAT_DELAY);
    };
    const onContextMenu = (event: Event): void => event.preventDefault();

    button.addEventListener("pointerdown", onDown);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("contextmenu", onContextMenu);
    cleanups.push(() => {
      stop();
      button.removeEventListener("pointerdown", onDown);
      button.removeEventListener("pointerup", stop);
      button.removeEventListener("pointercancel", stop);
      button.removeEventListener("pointerleave", stop);
      button.removeEventListener("contextmenu", onContextMenu);
    });
  }

  return () => {
    doc.removeEventListener("keydown", onKeyDown);
    for (const cleanup of cleanups) cleanup();
  };
}
