import { describe, expect, test } from "vitest";

import { negotiateEncoding } from "../../scripts/content-encoding";

describe("preview content-encoding negotiation", () => {
  test("prefers brotli when the client accepts it", () => {
    expect(negotiateEncoding("gzip, deflate, br", "/dist/index.html")).toEqual({
      statusCode: 200,
      encoding: "br",
    });
    expect(negotiateEncoding("br", "/dist/_astro/index.css")).toEqual({
      statusCode: 200,
      encoding: "br",
    });
  });

  test("treats normalized zero quality as a refusal", () => {
    expect(negotiateEncoding("br;q=0.0, gzip", "/dist/index.html")).toEqual({
      statusCode: 200,
      encoding: "gzip",
    });
  });

  test("returns 406 when compression and identity are all refused", () => {
    expect(
      negotiateEncoding("br;q=0.0, gzip;q=0, identity;q=0", "/dist/index.html"),
    ).toEqual({ statusCode: 406 });
  });

  test("falls back to gzip when brotli is not accepted", () => {
    expect(negotiateEncoding("gzip, deflate", "/dist/index.html")).toEqual({
      statusCode: 200,
      encoding: "gzip",
    });
  });

  test("serves identity when the client accepts no known encoding", () => {
    expect(negotiateEncoding(undefined, "/dist/index.html")).toEqual({
      statusCode: 200,
    });
    expect(negotiateEncoding("", "/dist/index.html")).toEqual({
      statusCode: 200,
    });
    expect(negotiateEncoding("identity", "/dist/index.html")).toEqual({
      statusCode: 200,
    });
  });

  test("honors q=0 refusals", () => {
    expect(negotiateEncoding("br;q=0, gzip", "/dist/index.html")).toEqual({
      statusCode: 200,
      encoding: "gzip",
    });
    expect(negotiateEncoding("br;q=0, gzip;q=0", "/dist/index.html")).toEqual({
      statusCode: 200,
    });
  });

  test("ignores q-values other than zero", () => {
    expect(
      negotiateEncoding("gzip;q=1.0, br;q=0.8", "/dist/index.html"),
    ).toEqual({ statusCode: 200, encoding: "br" });
  });

  test("never compresses binary assets", () => {
    expect(negotiateEncoding("gzip, br", "/dist/_astro/hanken.woff2")).toEqual({
      statusCode: 200,
    });
    expect(negotiateEncoding("gzip, br", "/dist/favicon-32.png")).toEqual({
      statusCode: 200,
    });
  });

  test("compresses every text type the site serves", () => {
    for (const path of [
      "/dist/index.html",
      "/dist/_astro/global.css",
      "/dist/_astro/page.js",
      "/dist/agents.md",
      "/dist/llms.txt",
      "/dist/favicon.svg",
      "/dist/sitemap-index.xml",
    ]) {
      expect(negotiateEncoding("br", path)).toEqual({
        statusCode: 200,
        encoding: "br",
      });
    }
  });
});
