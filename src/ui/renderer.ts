import { COLS, ROWS } from "../core/board";
import { ghostPiece, levelOf } from "../core/game";
import { getCells } from "../core/pieces";
import type { ActivePiece, GameState, PieceType } from "../core/types";

/** 画面（表示領域）の高さが、この値以上の場合に対応する。 */
const MIN_VIEWPORT_HEIGHT = 640;
/** 盤面の上下の、盤面以外の高さの合計（上段 72 + ボタン 3 行 168 + 余白・隙間 24）。 */
const NON_BOARD_HEIGHT = 264;
const MIN_CELL = 12;
const MAX_CELL = 32;
const NEXT_SIZE = 72;
const NEXT_CELL = 18;

export const COLORS: Record<PieceType, string> = {
  I: "#00bcd4",
  O: "#ffd600",
  T: "#9c27b0",
  S: "#4caf50",
  Z: "#f44336",
  J: "#2962ff",
  L: "#ff9800",
};

const EMPTY_COLOR = "#1b1b1b";
const GRID_COLOR = "#2a2a2a";

/** 高さが 640px 以上なら対応。未満は対象外で、案内を表示する。 */
export function isViewportSupported(vh: number): boolean {
  return vh >= MIN_VIEWPORT_HEIGHT;
}

/** 画面の大きさから、マスの大きさ（px）を求める。12 以上 32 以下の整数。 */
export function computeCellSize(vw: number, vh: number): number {
  const byHeight = Math.floor((vh - NON_BOARD_HEIGHT) / ROWS);
  const byWidth = Math.floor((vw - 16) / COLS);
  return Math.min(MAX_CELL, Math.max(MIN_CELL, Math.min(byHeight, byWidth)));
}

function required<T extends HTMLElement>(doc: Document, id: string): T {
  const el = doc.getElementById(id);
  if (el === null) throw new Error(`#${id} が見つかりません`);
  return el as T;
}

export interface Renderer {
  /** 画面の高さに応じて、ゲームか案内かを切り替える。対応する高さなら true。 */
  applyViewport(vh: number): boolean;
  render(state: GameState, vw: number, vh: number): void;
}

export function createRenderer(doc: Document): Renderer {
  const boardCanvas = required<HTMLCanvasElement>(doc, "board");
  const nextCanvas = required<HTMLCanvasElement>(doc, "next");
  const game = required<HTMLElement>(doc, "game");
  const notice = required<HTMLElement>(doc, "notice");
  const scoreEl = required<HTMLElement>(doc, "score");
  const levelEl = required<HTMLElement>(doc, "level");
  const linesEl = required<HTMLElement>(doc, "lines");
  const pauseButton = doc.querySelector<HTMLButtonElement>('button[data-action="togglePause"]');

  const boardCtx = boardCanvas.getContext("2d");
  const nextCtx = nextCanvas.getContext("2d");
  if (boardCtx === null || nextCtx === null) {
    game.hidden = true;
    notice.hidden = false;
    notice.textContent = "このブラウザでは動作しません";
    throw new Error("Canvas を取得できません");
  }

  let cell = 0;

  function drawPiece(piece: ActivePiece, alpha: number): void {
    if (boardCtx === null) return;
    boardCtx.globalAlpha = alpha;
    boardCtx.fillStyle = COLORS[piece.type];
    for (const [dc, dr] of getCells(piece.type, piece.rotation)) {
      const row = piece.y + dr;
      if (row < 0) continue;
      boardCtx.fillRect((piece.x + dc) * cell + 1, row * cell + 1, cell - 2, cell - 2);
    }
    boardCtx.globalAlpha = 1;
  }

  function drawMessage(lines: readonly string[]): void {
    if (boardCtx === null) return;
    const w = COLS * cell;
    const h = ROWS * cell;
    boardCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
    boardCtx.fillRect(0, 0, w, h);
    boardCtx.fillStyle = "#fff";
    boardCtx.textAlign = "center";
    boardCtx.textBaseline = "middle";
    lines.forEach((text, i) => {
      boardCtx.font = `${i === 0 ? "bold " : ""}${Math.round(cell * (i === 0 ? 1.1 : 0.7))}px sans-serif`;
      boardCtx.fillText(text, w / 2, h / 2 + i * cell * 1.4 - ((lines.length - 1) * cell * 0.7));
    });
  }

  function drawBoard(state: GameState): void {
    if (boardCtx === null) return;
    boardCtx.clearRect(0, 0, COLS * cell, ROWS * cell);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const filled = state.board[r]?.[c] ?? null;
        boardCtx.fillStyle = filled === null ? EMPTY_COLOR : COLORS[filled];
        boardCtx.fillRect(c * cell, r * cell, cell, cell);
        boardCtx.strokeStyle = GRID_COLOR;
        boardCtx.strokeRect(c * cell + 0.5, r * cell + 0.5, cell - 1, cell - 1);
        if (filled !== null) {
          boardCtx.fillStyle = COLORS[filled];
          boardCtx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
        }
      }
    }
    const ghost = ghostPiece(state);
    if (ghost !== null) drawPiece(ghost, 0.3);
    // ゴーストと重なる場合は、操作中のミノを優先して、上に描く
    if (state.active !== null) drawPiece(state.active, 1);
  }

  function drawNext(type: PieceType | undefined): void {
    if (nextCtx === null) return;
    nextCtx.clearRect(0, 0, NEXT_SIZE, NEXT_SIZE);
    if (type === undefined) return;
    const cells = getCells(type, 0);
    const cols = cells.map(([c]) => c);
    const rows = cells.map(([, r]) => r);
    const width = Math.max(...cols) - Math.min(...cols) + 1;
    const height = Math.max(...rows) - Math.min(...rows) + 1;
    const ox = (NEXT_SIZE - width * NEXT_CELL) / 2 - Math.min(...cols) * NEXT_CELL;
    const oy = (NEXT_SIZE - height * NEXT_CELL) / 2 - Math.min(...rows) * NEXT_CELL;
    nextCtx.fillStyle = COLORS[type];
    for (const [c, r] of cells) {
      nextCtx.fillRect(ox + c * NEXT_CELL + 1, oy + r * NEXT_CELL + 1, NEXT_CELL - 2, NEXT_CELL - 2);
    }
  }

  return {
    applyViewport(vh: number): boolean {
      const supported = isViewportSupported(vh);
      game.hidden = !supported;
      notice.hidden = supported;
      return supported;
    },

    render(state: GameState, vw: number, vh: number): void {
      const size = computeCellSize(vw, vh);
      if (size !== cell) {
        cell = size;
        boardCanvas.width = COLS * cell;
        boardCanvas.height = ROWS * cell;
      }
      drawBoard(state);
      if (state.status === "paused") drawMessage(["一時停止中"]);
      if (state.status === "gameover") {
        drawMessage(["ゲームオーバー", "R キーまたはリスタート"]);
      }
      drawNext(state.queue[0]);
      scoreEl.textContent = String(state.score);
      levelEl.textContent = String(levelOf(state.lines));
      linesEl.textContent = String(state.lines);
      if (pauseButton !== null) {
        pauseButton.textContent = state.status === "paused" ? "再開" : "一時停止";
      }
    },
  };
}
