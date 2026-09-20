import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import fs from "node:fs";
import { SITE_TAB, USER_AVATAR, USER_NAME, USER_SITE } from "@config";
import type { APIContext, GetStaticPaths } from "astro";
import qrcode from "qrcode-generator";
import satori from "satori";

import sharp from "sharp";

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type FontStyle = "normal" | "italic";
interface FontOptions {
  data: Buffer | ArrayBuffer;
  name: string;
  weight?: Weight;
  style?: FontStyle;
  lang?: string;
}
// ---- OG 图右下角的文章二维码 ----
// 单元格边长（px）：整体尺寸 = 模块数 × 该值 + 两侧留白
const QR_CELL_SIZE = 4;
// 留白相当于 4 个模块的静默区，保证扫码识别率
const QR_PADDING = 16;
const QR_DARK_COLOR = "#1E293B";
const QR_LIGHT_COLOR = "#FFFFFF";

type OgElement = Record<string, unknown>;

// 把二维码画成 satori 能渲染的 div 网格（避免依赖图片 data URI 的额外处理）
function buildQrElement(text: string): OgElement {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const rows: OgElement[] = [];

  for (let row = 0; row < count; row++) {
    const cells: OgElement[] = [];
    for (let col = 0; col < count; col++) {
      cells.push({
        type: "div",
        props: {
          style: {
            width: `${QR_CELL_SIZE}px`,
            height: `${QR_CELL_SIZE}px`,
            backgroundColor: qr.isDark(row, col)
              ? QR_DARK_COLOR
              : QR_LIGHT_COLOR,
          },
        },
      });
    }
    rows.push({
      type: "div",
      props: { style: { display: "flex" }, children: cells },
    });
  }

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        padding: `${QR_PADDING}px`,
        backgroundColor: QR_LIGHT_COLOR,
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
      },
      children: rows,
    },
  };
}

export const prerender = true;

type FontCache = { regular: Buffer | null; bold: Buffer | null };
type OgFonts = FontOptions[];

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getCollection("blog");
  const publishedPosts = allPosts.filter(
    (post: CollectionEntry<"blog">) => !post.data.draft,
  );

  return publishedPosts.map((post: CollectionEntry<"blog">) => ({
    params: { slug: post.id },
    props: { post },
  }));
};

let fontCache: FontCache | null = null;
let fontCachePromise: Promise<FontCache> | null = null;

function validateSlug(slug: unknown): slug is string {
  if (typeof slug !== "string") return false;
  if (slug.length === 0 || slug.length > 200) return false;
  if (slug.includes("..") || slug.includes("\\")) return false;
  if (slug.startsWith("/")) return false;
  return /^[a-z0-9\-/]+$/i.test(slug);
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function fetchWithTimeout(input: RequestInfo | URL, timeoutMs: number) {
  const { signal, clear } = createTimeoutSignal(timeoutMs);
  try {
    return await fetch(input, { signal });
  } finally {
    clear();
  }
}

async function buildAvatarDataUri(): Promise<string> {
  const avatarBuffer = await fs.promises.readFile(`./public/${USER_AVATAR}`);
  return `data:image/png;base64,${avatarBuffer.toString("base64")}`;
}

function buildFonts(
  fontRegular: Buffer | null,
  fontBold: Buffer | null,
): OgFonts {
  const fonts: FontOptions[] = [];
  if (fontRegular) {
    fonts.push({
      name: "Noto Sans SC",
      data: fontRegular,
      weight: 400,
      style: "normal",
    });
  }
  if (fontBold) {
    fonts.push({
      name: "Noto Sans SC",
      data: fontBold,
      weight: 700,
      style: "normal",
    });
  }
  return fonts;
}

function buildOgTemplate({
  post,
  avatarBase64,
  qrElement,
}: {
  post: CollectionEntry<"blog">;
  avatarBase64: string;
  qrElement: OgElement;
}) {
  const primaryColor = "#4F46E5";
  const textColor = "#1E293B";
  const subtleTextColor = "#64748B";
  const backgroundColor = "#FFFFFF";

  const pubDate = post.data.pubDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const description = post.data.description;

  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor,
        fontFamily:
          '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: "60px",
        paddingTop: "60px",
        // 右下角多了二维码后底部变高，留白相应收小，避免长标题被挤出画布
        paddingBottom: "48px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "36px",
                    fontWeight: 600,
                    color: subtleTextColor,
                  },
                  children: SITE_TAB,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flexGrow: 1,
              gap: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "flex-start",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "10px",
                          height: "68px",
                          backgroundColor: primaryColor,
                          borderRadius: "6px",
                          marginTop: "14px",
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "72px",
                          fontWeight: 700,
                          lineHeight: 1.2,
                          color: textColor,
                          marginLeft: "25px",
                          display: "-webkit-box",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineClamp: 3,
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        },
                        children: post.data.title,
                      },
                    },
                  ],
                },
              },
              description && {
                type: "div",
                props: {
                  style: {
                    fontSize: "32px",
                    lineHeight: 1.5,
                    color: subtleTextColor,
                    paddingLeft: "35px",
                    display: "-webkit-box",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineClamp: 2,
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  },
                  children: description,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              width: "100%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: avatarBase64,
                        width: 60,
                        height: 60,
                        style: { borderRadius: "50%" },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "28px",
                                fontWeight: 600,
                                color: textColor,
                              },
                              children: USER_NAME,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "24px",
                                color: subtleTextColor,
                              },
                              children: pubDate,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // 右下角：扫码打开本文
              qrElement,
            ],
          },
        },
      ],
    },
  };
}

async function generateOgPng({
  template,
  fonts,
}: {
  template: any;
  fonts: OgFonts;
}): Promise<Buffer> {
  const svg = await satori(template, {
    width: 1200,
    height: 630,
    fonts,
  });
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function generateFallbackPng(): Promise<Buffer> {
  return await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

// 字体取自 Google Fonts：原先写死 5 秒超时，网络稍慢就会被中断，OG 图会静默退化成空白占位图，故放宽
const FONT_FETCH_TIMEOUT_MS = 20000;
// 可选：把 OG_FONT_PATH 指向本地字体文件（TTF/OTF/WOFF）后，构建期不再访问 Google Fonts。
// 用途：离线构建、本地预览真实 OG 图，以及字体 CDN 不可达时兜底。
const LOCAL_FONT_PATH = process.env.OG_FONT_PATH;

async function fetchNotoSansSCFonts(): Promise<FontCache> {
  if (fontCache) return fontCache;
  if (fontCachePromise) return await fontCachePromise;

  if (LOCAL_FONT_PATH) {
    try {
      const data = await fs.promises.readFile(LOCAL_FONT_PATH);
      const local = { regular: data, bold: data };
      fontCache = local;
      return local;
    } catch (err) {
      console.warn(
        `[og] 读取本地字体失败（${LOCAL_FONT_PATH}），回退到 Google Fonts`,
        err,
      );
    }
  }

  fontCachePromise = (async () => {
    try {
      const cssResp = await fetchWithTimeout(
        "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap",
        FONT_FETCH_TIMEOUT_MS,
      );
      if (!cssResp.ok) throw new Error("Failed to fetch Google Fonts CSS");
      const cssText = await cssResp.text();

      const getUrlForWeight = (weight: number) => {
        const blockRe = new RegExp(
          String.raw`@font-face\s*{[^}]*font-weight:\s*${weight}[^}]*}`,
          "g",
        );
        const match = blockRe.exec(cssText);
        if (!match) return null;
        const urlMatch = /url\((https:[^)]+)\)/.exec(match[0]);
        return urlMatch ? urlMatch[1] : null;
      };

      const regularUrl = getUrlForWeight(400);
      const boldUrl = getUrlForWeight(700);

      if (!regularUrl || !boldUrl) {
        const result = { regular: null, bold: null };
        fontCache = result;
        return result;
      }

      const [rResp, bResp] = await Promise.all([
        fetchWithTimeout(regularUrl, FONT_FETCH_TIMEOUT_MS),
        fetchWithTimeout(boldUrl, FONT_FETCH_TIMEOUT_MS),
      ]);

      if (!rResp.ok || !bResp.ok) {
        const result = { regular: null, bold: null };
        fontCache = result;
        return result;
      }

      const rBuf = Buffer.from(await rResp.arrayBuffer());
      const bBuf = Buffer.from(await bResp.arrayBuffer());

      const result = { regular: rBuf, bold: bBuf };
      fontCache = result;
      return result;
    } catch (err) {
      console.error("[og] font fetch failed", err);
      const result = { regular: null, bold: null };
      fontCache = result;
      return result;
    } finally {
      fontCachePromise = null;
    }
  })();

  return await fontCachePromise;
}

export async function GET({
  params,
  props,
  site,
}: APIContext<{ post: CollectionEntry<"blog"> }>) {
  if (!validateSlug(params?.slug)) {
    const png = await generateFallbackPng();
    return new Response(new Uint8Array(png), {
      status: 400,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const { post } = props;

    const [{ regular: fontRegular, bold: fontBold }, avatarBase64] =
      await Promise.all([fetchNotoSansSCFonts(), buildAvatarDataUri()]);

    // 二维码内容 = 文章正式地址（与页面 canonical 保持一致）
    const postUrl = new URL(`/blog/${post.id}`, site ?? USER_SITE).toString();
    const template = buildOgTemplate({
      post,
      avatarBase64,
      qrElement: buildQrElement(postUrl),
    });
    const fonts = buildFonts(fontRegular, fontBold);
    const png = await generateOgPng({ template, fonts });

    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[og] image generation failed", { slug: params?.slug, err });
    const png = await generateFallbackPng();
    return new Response(new Uint8Array(png), {
      status: 500,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  }
}
