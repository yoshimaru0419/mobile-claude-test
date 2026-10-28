import { applyAction, createGame, levelOf } from "../core/game";
import type { Action, GameState } from "../core/types";
import { attachInput } from "./input";
import { createRenderer } from "./renderer";
import { stepTimer } from "./timer";

const renderer = createRenderer(document);

let state: GameState = createGame(Math.random);
let acc = 0; // 落下タイマーの蓄積時間（ミリ秒）
let last: number | null = null;
let lastPieceCount = state.pieceCount;
let supported = renderer.applyViewport(window.innerHeight);

function dispatch(action: Action): void {
  // 高さが足りない間は、ゲームを進めず、入力も受け付けない
  if (!supported) return;
  const before = state.status;
  state = applyAction(state, action);
  // 一時停止から再開したとき、リスタートしたときは、蓄積時間を 0 に戻す
  // （リスタート直後は pieceCount が変わらない場合があるため、明示的に戻す）
  if (action === "restart" || (before === "paused" && state.status === "playing")) acc = 0;
}

attachInput(document, dispatch);

function frame(now: number): void {
  // 前回の時刻は、最初のフレームでは今回の時刻。一時停止中も毎フレーム更新する
  const dt = last === null ? 0 : now - last;
  last = now;

  supported = renderer.applyViewport(window.innerHeight);
  if (supported) {
    if (state.pieceCount !== lastPieceCount) {
      // 新しいミノが出たときは、蓄積時間を 0 に戻す
      lastPieceCount = state.pieceCount;
      acc = 0;
    }
    const result = stepTimer(acc, dt, state.status, levelOf(state.lines));
    acc = result.acc;
    if (result.tick) state = applyAction(state, "tick");
    renderer.render(state, window.innerWidth, window.innerHeight);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
