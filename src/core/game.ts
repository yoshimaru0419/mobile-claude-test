import { takeNext, ensureQueue } from "./bag";
import { createBoard, landingY, lock, rotated, shifted, collides } from "./board";
import type { Action, ActivePiece, GameState, Rng } from "./types";

/** ミノの出現位置。形の行列の左端を列 3、最上段（行 0）に合わせる。 */
const SPAWN_X = 3;
const SPAWN_Y = 0;

/** 次のミノを出す。 */
function spawnNext(state: GameState): GameState {
  const { type, queue } = takeNext(state.queue, state.rng);
  const active: ActivePiece = { type, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
  return { ...state, queue, active, pieceCount: state.pieceCount + 1 };
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

/** 固定して、次のミノを出す。 */
function lockAndSpawn(state: GameState, piece: ActivePiece): GameState {
  return spawnNext({ ...state, board: lock(state.board, piece), active: null });
}

/** 1 マス下げる。下げられなければ、固定して次のミノを出す（tick と softDrop で共通）。 */
function stepDown(state: GameState, piece: ActivePiece): GameState {
  const down = { ...piece, y: piece.y + 1 };
  if (!collides(state.board, down)) return { ...state, active: down };
  return lockAndSpawn(state, piece);
}

/** 操作を適用して、新しい状態を返す。元の状態は変更しない。 */
export function applyAction(state: GameState, action: Action): GameState {
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
