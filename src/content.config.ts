import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        description: z.string(),
        since: z.string().optional(),
        source: z.union([z.string(), z.array(z.string())]).optional(),
        audience: z
          .array(z.enum(["operator", "agent", "contributor"]))
          .optional(),
        generated: z.boolean().default(false),
      }),
    }),
  }),
  machine: defineCollection({
    loader: glob({ base: "./src/content/machine", pattern: "**/*.md" }),
    schema: z.object({
      description: z.string(),
      route: z.enum(["/agents.md", "/llms.txt"]),
      generated: z.boolean(),
    }),
  }),
};
