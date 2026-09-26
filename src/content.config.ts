import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog",
    // 文章与自己的封面/插图放在同一目录（<slug>/index.md[x] + cover.webp）。
    // glob 默认把这种目录式条目的 id 记为 "<slug>/index"，这里剥掉 "/index"，
    // 保证文章 URL（/blog/<id>）、RSS 与 OG 路由和拆分前完全一致。
    generateId: ({ entry }) =>
      entry.replace(/\.(md|mdx)$/, "").replace(/\/index$/, ""),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      // 封面图与文章同目录，写相对路径（如 ./cover.webp）。
      // 用 image() 校验后拿到 ImageMetadata，交给 astro:assets 做压缩与响应式输出。
      image: image().optional(),
      badge: z.string().optional(),
      draft: z.boolean().default(false),
      categories: z
        .array(z.string())
        .refine((items: string[]) => new Set(items).size === items.length, {
          message: "categories must be unique",
        })
        .optional(),
      tags: z
        .array(z.string())
        .refine((items: string[]) => new Set(items).size === items.length, {
          message: "tags must be unique",
        })
        .optional(),
    }),
});

export const collections = { blog };
