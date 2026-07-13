import { getCollection, getEntry } from "astro:content";

import release from "../data/release.json";
import { renderLlmsTxt } from "../lib/llms-txt";

export const prerender = true;

export async function GET() {
  const [llms, docs] = await Promise.all([
    getEntry("machine", "llms"),
    getCollection("docs"),
  ]);
  if (!llms) {
    throw new Error("Missing machine content entry: llms");
  }

  const body = renderLlmsTxt(
    release,
    docs.map((entry) => ({
      id: entry.id,
      description: entry.data.description,
    })),
    llms.body,
  );

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
