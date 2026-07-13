import { describe, expect, it } from "vitest";

import { typingBoundaries } from "../../src/lib/scenes/scene-typing";

function intervals(boundaries: readonly number[]): number[] {
  return boundaries.map((boundary, index) =>
    index === 0 ? boundary : boundary - boundaries[index - 1],
  );
}

describe("typingBoundaries", () => {
  it("adds deterministic natural jitter while preserving punctuation hesitation", () => {
    const text = "letters vary, then stop.";
    const first = typingBoundaries(text);
    const second = typingBoundaries(text);
    const cadence = intervals(first);
    const letterCadence = cadence.filter((_, index) =>
      /[a-z]/i.test(text[index]),
    );

    expect(first).toEqual(second);
    expect(first.at(-1)).toBe(1);
    expect(
      new Set(letterCadence.map((value) => value.toFixed(5))).size,
    ).toBeGreaterThan(3);
    expect(cadence[text.indexOf(",")]).toBeGreaterThan(
      Math.max(...letterCadence),
    );
    expect(cadence[text.indexOf(".")]).toBeGreaterThan(
      cadence[text.indexOf(",")],
    );
  });
});
