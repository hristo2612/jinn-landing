import fs from "node:fs";

import { describe, expect, it } from "vitest";

describe("deployment configuration", () => {
  it("uses Vercel-supported package metadata for the pinned toolchain", () => {
    const npmrc = fs.readFileSync(".npmrc", "utf8");
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
      engines?: { node?: string; pnpm?: string };
      packageManager?: string;
    };

    expect(npmrc).not.toMatch(/^use-node-version\s*=/mu);
    expect(npmrc).toMatch(/^engine-strict=true$/mu);
    expect(packageJson.engines).toEqual({
      node: ">=24 <25",
      pnpm: "10.6.4",
    });
    expect(packageJson.packageManager).toBe("pnpm@10.6.4");
  });
});
