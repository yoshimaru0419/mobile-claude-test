import { PIECE_TYPES, type PieceType } from "./types";

/** ミノの占めるマスの、形の行列の中での位置（列, 行）。 */
export type Offset = readonly [col: number, row: number];

type Matrix = readonly (readonly number[])[];

/** 基本の向きの形。I と O は 4 × 4、それ以外は 3 × 3。 */
const BASE_ROWS: Record<PieceType, readonly string[]> = {
  I: ["0000", "1111", "0000", "0000"],
  O: ["0110", "0110", "0000", "0000"],
  T: ["010", "111", "000"],
  S: ["011", "110", "000"],
  Z: ["110", "011", "000"],
  J: ["100", "111", "000"],
  L: ["001", "111", "000"],
};

function parse(rows: readonly string[]): Matrix {
  return rows.map((row) => [...row].map((ch) => (ch === "1" ? 1 : 0)));
}

/** 時計回りに 90 度回す。新しい [r][c] = 元の [n - 1 - c][r]。 */
function rotateCW(m: Matrix): Matrix {
  const n = m.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => m[n - 1 - c]?.[r] ?? 0),
  );
}

function toOffsets(m: Matrix): readonly Offset[] {
  const cells: Offset[] = [];
  m.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === 1) cells.push([c, r]);
    }),
  );
  return cells;
}

function buildShapes(): Record<PieceType, readonly (readonly Offset[])[]> {
  const shapes = {} as Record<PieceType, readonly (readonly Offset[])[]>;
  for (const type of PIECE_TYPES) {
    let m = parse(BASE_ROWS[type]);
    const rotations: (readonly Offset[])[] = [];
    for (let i = 0; i < 4; i++) {
      rotations.push(toOffsets(m));
      // O は、回転しても形も位置も変わらない
      if (type !== "O") m = rotateCW(m);
    }
    shapes[type] = rotations;
  }
  return shapes;
}

/** 種類ごとに、4 つの向きの占めるマスを、起動時に 1 度だけ計算して持つ。 */
const SHAPES = buildShapes();

/** ミノの占めるマスの、形の行列の中での位置（4 件）。向きは 0〜3 に丸める。 */
export function getCells(type: PieceType, rotation: number): readonly Offset[] {
  const rotations = SHAPES[type];
  return rotations[((rotation % 4) + 4) % 4] ?? [];
}
