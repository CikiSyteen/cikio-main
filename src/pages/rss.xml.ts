import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import {
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_TAB,
  SITE_TITLE,
  USER_SITE,
} from "@config";
import type { APIContext } from "astro";

function replacePath(content: string, siteUrl: string): string {
  return content.replaceAll(
    /(src|img|r|l|href)="([^"]+)"/g,
    (match, attr, src) => {
      if (
        !src.startsWith("http") &&
        !src.startsWith("//") &&
        !src.startsWith("data:") &&
        !src.startsWith("#")
      ) {
        return `${attr}="${new URL(src, siteUrl).toString()}"`;
      }
      return match;
    },
  );
}

function toUtcDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

export async function GET(context: APIContext) {
  const siteUrl = context.site ? new URL(context.site) : new URL(USER_SITE);
  const allPosts = await getCollection("blog");
  // Filter out draft posts in production mode
  const posts = import.meta.env.PROD
    ? allPosts.filter((post: CollectionEntry<"blog">) => !post.data.draft)
    : allPosts;
  const sortedPosts = posts.sort(
    (a: CollectionEntry<"blog">, b: CollectionEntry<"blog">) =>
      new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime(),
  );

  const items = await Promise.all(
    sortedPosts.map(async (blog: CollectionEntry<"blog">) => {
      const {
        data: { title, description, pubDate },
        body,
      } = blog;

      let content = "暂无正文内容。";
      if (body) {
        const renderedHtml = blog.rendered?.html;
        content = renderedHtml
          ? replacePath(renderedHtml, siteUrl.toString())
          : "暂无正文内容。";
      }

      const postURL = new URL(`/blog/${blog.id}/`, siteUrl);

      return {
        title,
        description,
        link: postURL.toString(),
        guid: postURL.toString(),
        content: `${content} <blockquote>本内容由 Frosti Feed 自动生成，可能存在排版问题；建议直接访问原文：<a href="${postURL}">${postURL}</a></blockquote>`,
        customData: `
        <dc:creator><![CDATA[${SITE_TAB}]]></dc:creator>
        <pubDate>${toUtcDate(pubDate).toUTCString()}</pubDate>
      `,
      };
    }),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: siteUrl,
    items,
    customData: `
      <language>${SITE_LANGUAGE}</language>
    `,
    xmlns: {
      dc: "http://purl.org/dc/elements/1.1/",
      content: "http://purl.org/rss/1.0/modules/content/",
      atom: "http://www.w3.org/2005/Atom",
    },
  });
}
