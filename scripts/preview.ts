import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { pipeline } from "node:stream";
import { constants, createBrotliCompress, createGzip } from "node:zlib";

import { negotiateEncoding } from "./content-encoding";

const args = process.argv.slice(2);

function argument(name: string, fallback: string): string {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const host = argument("--host", "127.0.0.1");
const port = Number(argument("--port", "4321"));
const root = resolve("dist");
const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function artifactPath(pathname: string): string | undefined {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.endsWith("/") ? `${decoded}index.html` : decoded;
  const path = resolve(root, `.${relativePath}`);

  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    return undefined;
  }

  return statSync(path, { throwIfNoEntry: false })?.isFile() ? path : undefined;
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${host}:${port}`)
    .pathname;
  const artifact = artifactPath(pathname);
  const path = artifact ?? resolve(root, "404.html");

  response.statusCode = artifact ? 200 : 404;
  response.setHeader(
    "Content-Type",
    contentTypes[extname(path)] ?? "application/octet-stream",
  );
  response.setHeader("Vary", "Accept-Encoding");

  const negotiation = negotiateEncoding(
    request.headers["accept-encoding"],
    path,
  );
  if (negotiation.statusCode === 406) {
    response.statusCode = 406;
    response.end("Not Acceptable");
    return;
  }

  const encoding = negotiation.encoding;
  const source = createReadStream(path);
  if (!encoding) {
    source.pipe(response);
    return;
  }

  // Real hosts serve statically precompressed artifacts with zero encode
  // latency; Node's default brotli quality (11) costs ~40-50ms per asset and
  // distorts load timing enough to race e2e fixtures. Quality 5 compresses in
  // ~1ms with near-identical transfer sizes (140KB HTML: 10.1KB vs 9.0KB).
  response.setHeader("Content-Encoding", encoding);
  pipeline(
    source,
    encoding === "br"
      ? createBrotliCompress({
          params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
        })
      : createGzip(),
    response,
    () => {},
  );
});

server.listen(port, host, () => {
  console.log(`Static preview listening at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
