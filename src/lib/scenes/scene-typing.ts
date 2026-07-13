function cadenceWeight(character: string, index: number): number {
  const base = /[.!?]/.test(character)
    ? 2.8
    : /[,;:-]/.test(character)
      ? 1.9
      : character === " "
        ? 0.55
        : 1;
  let seed = Math.imul(character.codePointAt(0) ?? 0, 0x45d9f3b);
  seed ^= Math.imul(index + 1, 0x27d4eb2d);
  seed ^= seed >>> 16;
  const jitter = 0.85 + ((seed >>> 0) % 31) / 100;
  return base * jitter;
}

/**
 * Stable per-character reveal boundaries. The seeded variation reads as
 * natural typing without making checkpoint captures nondeterministic.
 */
export function typingBoundaries(text: string): number[] {
  const weights = Array.from(text, cadenceWeight);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let elapsed = 0;
  return weights.map((weight, index) => {
    elapsed += weight;
    return index === weights.length - 1 ? 1 : elapsed / total;
  });
}
