import { PIECE_TYPES, type PieceType, type Rng } from "./types";

/** バッグの補充の基準。queue が、この数未満の間、7 種を足す。 */
const MIN_QUEUE = 7;

/** 7 種を、Fisher-Yates 法でシャッフルした配列。 */
export function shuffledBag(rng: Rng): PieceType[] {
  const bag: PieceType[] = [...PIECE_TYPES];
  for (let i = bag.length - 1; i >= 1; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = bag[i] as PieceType;
    bag[i] = bag[j] as PieceType;
    bag[j] = a;
  }
  return bag;
}

/** queue が 7 個未満の間、シャッフルした 7 種を末尾に足す。元の queue は変更しない。 */
export function ensureQueue(queue: readonly PieceType[], rng: Rng): readonly PieceType[] {
  let next = queue;
  while (next.length < MIN_QUEUE) next = [...next, ...shuffledBag(rng)];
  return next;
}

/** 先頭を取り出し、補充した queue を返す。 */
export function takeNext(
  queue: readonly PieceType[],
  rng: Rng,
): { type: PieceType; queue: readonly PieceType[] } {
  const filled = ensureQueue(queue, rng);
  const [type, ...rest] = filled as [PieceType, ...PieceType[]];
  return { type, queue: ensureQueue(rest, rng) };
}

/** 先頭の種類を、取り出さずに読む（NEXT 表示用）。 */
export function peekNext(queue: readonly PieceType[]): PieceType | undefined {
  return queue[0];
}
