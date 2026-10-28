/** 固定列を順に返す乱数（末尾まで来たら先頭に戻る）。 */
export function seqRng(values: readonly number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] as number;
    i++;
    return v;
  };
}
