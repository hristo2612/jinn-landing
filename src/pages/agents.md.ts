import { getEntry } from "astro:content";

export const prerender = true;

export async function GET() {
  const agents = await getEntry("machine", "agents");
  if (!agents) {
    throw new Error("Missing machine content entry: agents");
  }

  return new Response(agents.body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
