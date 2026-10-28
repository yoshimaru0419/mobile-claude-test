import { dropInterval } from "../core/game";
import type { Status } from "../core/types";

/** 1 フレームで進める時間の上限（ミリ秒）。タブが非表示だった後の連続落下を防ぐ。 */
export const MAX_DT = 250;

/**
 * 蓄積時間を進め、tick を送るかを返す（純関数）。
 * playing 以外は、蓄積時間を変えず、tick もなし。1 フレームで送る tick は最大 1 回。
 */
export function stepTimer(
  acc: number,
  dt: number,
  status: Status,
  level: number,
): { acc: number; tick: boolean } {
  if (status !== "playing") return { acc, tick: false };
  const interval = dropInterval(level);
  let next = acc + Math.min(Math.max(dt, 0), MAX_DT);
  if (next < interval) return { acc: next, tick: false };
  next -= interval;
  // まだ間隔以上なら、余りにする（蓄積し続けない）
  if (next >= interval) next %= interval;
  return { acc: next, tick: true };
}
