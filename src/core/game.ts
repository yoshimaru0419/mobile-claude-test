import { takeNext, ensureQueue } from "./bag";
import { clearLines, collides, createBoard, landingY, lock, rotated, shifted } from "./board";
import type { Action, ActivePiece, GameState, Rng } from "./types";

/** ミノの出現位置。形の行列の左端を列 3、最上段（行 0）に合わせる。 */
const SPAWN_X = 3;
const SPAWN_Y = 0;

/** 消した 1 行あたりの得点。ドロップでの加点はない。 */
const POINTS_PER_LINE = 100;
/** レベルが 1 上がるのに必要な、消去した累計行数。 */
const LINES_PER_LEVEL = 10;

/** 消去した累計行数から、レベルを導く（レベルは状態に持たない）。 */
export function levelOf(lines: number): number {
  return Math.floor(lines / LINES_PER_LEVEL) + 1;
}

/** 落下の間隔（ミリ秒）。レベル 1 = 1000、レベル 10 以降 = 100。 */
export function dropInterval(level: number): number {
  return Math.max(100, 1100 - 100 * level);
}

/** 次のミノを出す。出したミノの実マスが固定済みブロックと重なるなら、ゲームオーバーにする。 */
function spawnNext(state: GameState): GameState {
  const { type, queue } = takeNext(state.queue, state.rng);
  const active: ActivePiece = { type, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
  const pieceCount = state.pieceCount + 1;
  if (collides(state.board, active)) {
    return { ...state, queue, active: null, status: "gameover", pieceCount };
  }
  return { ...state, queue, active, pieceCount };
}

/** ゲームの開始。空の盤面から、最初のミノを出す。 */
export function createGame(rng: Rng): GameState {
  return spawnNext({
    board: createBoard(),
    active: null,
    queue: ensureQueue([], rng),
    score: 0,
    lines: 0,
    status: "playing",
    pieceCount: 0,
    rng,
  });
}

/** 固定し、ライン消去とスコアの加算をして、次のミノを出す。 */
function lockAndSpawn(state: GameState, piece: ActivePiece): GameState {
  const { board, cleared } = clearLines(lock(state.board, piece));
  return spawnNext({
    ...state,
    board,
    active: null,
    score: state.score + cleared * POINTS_PER_LINE,
    lines: state.lines + cleared,
  });
}

/** 1 マス下げる。下げられなければ、固定して次のミノを出す（tick と softDrop で共通）。 */
function stepDown(state: GameState, piece: ActivePiece): GameState {
  const down = { ...piece, y: piece.y + 1 };
  if (!collides(state.board, down)) return { ...state, active: down };
  return lockAndSpawn(state, piece);
}

/** 進行中と一時停止中を切り替える。ゲームオーバー中は何もしない。 */
function togglePause(state: GameState): GameState {
  if (state.status === "playing") return { ...state, status: "paused" };
  if (state.status === "paused") return { ...state, status: "playing" };
  return state;
}

/** 操作を適用して、新しい状態を返す。元の状態は変更しない。 */
export function applyAction(state: GameState, action: Action): GameState {
  if (action === "restart") return createGame(state.rng);
  if (action === "togglePause") return togglePause(state);

  const piece = state.active;
  if (state.status !== "playing" || piece === null) return state;

  switch (action) {
    case "left":
      return { ...state, active: shifted(state.board, piece, -1) };
    case "right":
      return { ...state, active: shifted(state.board, piece, 1) };
    case "rotate":
      return { ...state, active: rotated(state.board, piece) };
    case "softDrop":
    case "tick":
      return stepDown(state, piece);
    case "hardDrop":
      return lockAndSpawn(state, { ...piece, y: landingY(state.board, piece) });
    default:
      return state;
  }
}
