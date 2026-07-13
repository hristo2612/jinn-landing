import { describe, expect, it } from "vitest";

import { assertValidLinkScan } from "../../scripts/check-links";

const requiredUrls = ["http://127.0.0.1:4322/", "http://127.0.0.1:4322/docs/"];

describe("link gate", () => {
  it("rejects a scan that discovers no internal URLs", () => {
    expect(() => assertValidLinkScan([], requiredUrls)).toThrow(
      /zero internal URLs/i,
    );
  });

  it("rejects missing or broken required routes", () => {
    expect(() =>
      assertValidLinkScan(
        [{ url: requiredUrls[0], status: 200, state: "OK" }],
        requiredUrls,
      ),
    ).toThrow(/required internal URL/i);

    expect(() =>
      assertValidLinkScan(
        [
          { url: requiredUrls[0], status: 200, state: "OK" },
          { url: requiredUrls[1], status: 404, state: "BROKEN" },
        ],
        requiredUrls,
      ),
    ).toThrow(/broken/i);
  });

  it("accepts a non-zero scan where every required route is healthy", () => {
    expect(() =>
      assertValidLinkScan(
        [
          { url: requiredUrls[0], status: 200, state: "OK" },
          { url: requiredUrls[1], status: 200, state: "OK" },
        ],
        requiredUrls,
      ),
    ).not.toThrow();
  });
});
