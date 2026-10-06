function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function orderCommentsForPlayer<T>(
  comments: readonly T[],
  playerId: number,
  sessionId: number,
  getText: (comment: T) => string,
): T[] {
  const ordered = [...comments].sort((left, right) => getText(left).localeCompare(getText(right)));
  const random = seededRandom(Math.imul(playerId, 2654435761) ^ Math.imul(sessionId, 1597334677));

  for (let index = ordered.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
  }

  return ordered;
}
