import { extname } from "node:path";

/**
 * Production static hosts negotiate text compression; the preview server
 * mirrors that so release-gate Lighthouse runs measure the deployed reality
 * rather than an uncompressed transfer no host would serve. Fonts and other
 * binary assets are already compressed and pass through untouched.
 */
const compressibleExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".svg",
  ".txt",
  ".xml",
]);

export interface EncodingNegotiation {
  statusCode: 200 | 406;
  encoding?: "br" | "gzip";
}

function parseCoding(token: string): { name: string; quality: number } {
  const [name, ...params] = token.split(";");
  const qualityParameter = params.find(
    (param) => param.split("=", 1)[0]?.trim().toLowerCase() === "q",
  );
  const quality = qualityParameter
    ? Number(qualityParameter.slice(qualityParameter.indexOf("=") + 1).trim())
    : 1;
  return {
    name: name.trim().toLowerCase(),
    quality: Number.isFinite(quality) ? quality : 1,
  };
}

export function negotiateEncoding(
  acceptEncoding: string | undefined,
  path: string,
): EncodingNegotiation {
  const codings = (acceptEncoding ?? "").split(",").map(parseCoding);
  const accepted = new Set(
    codings
      .filter(({ name, quality }) => name !== "" && quality > 0)
      .map(({ name }) => name),
  );
  const identityRefused = codings.some(
    ({ name, quality }) => name === "identity" && quality === 0,
  );

  if (!compressibleExtensions.has(extname(path))) {
    return { statusCode: identityRefused ? 406 : 200 };
  }

  if (accepted.has("br")) {
    return { statusCode: 200, encoding: "br" };
  }
  if (accepted.has("gzip")) {
    return { statusCode: 200, encoding: "gzip" };
  }
  return { statusCode: identityRefused ? 406 : 200 };
}
