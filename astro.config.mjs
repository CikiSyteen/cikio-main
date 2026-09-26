import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { unified } from "@astrojs/markdown-remark";
import keystatic from "@keystatic/astro";
import playformCompress from "@playform/compress";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { CODE_THEME, USER_SITE } from "./src/config.ts";

import updateConfig from "./src/integration/updateConfig.ts";

import { remarkReadingTime } from "./src/plugins/remark-reading-time";

// Keystatic 只当作「本地可视化写作台」，仅在开发态挂载。两条硬约束：
//
//  1. @keystatic/astro 会注入两条 prerender:false 的路由（/keystatic、/api/keystatic）。
//     本站是纯静态输出（output: "static" 且没有 adapter），构建时挂载会直接以
//     [NoAdapterInstalled] 中断部署。
//  2. 必须保持「对象式」的 defineConfig。实测把配置改成函数式
//     （defineConfig(({ command }) => ({...}))）会让客户端构建阶段无法解析
//     astro-icon 的 virtual:astro-icon，rolldown 报错并崩溃（与 Keystatic 是否挂载无关）。
//
// 判定用 NODE_ENV：astro dev -> "development"，astro check / astro build / CI -> "production"。
const withKeystatic = process.env.NODE_ENV !== "production";

// https://astro.build/config
export default defineConfig({
  site: USER_SITE,
  output: "static",
  // 参考 Fuwari 的加载模式（Swup 的 preload）：链接在鼠标悬停（触屏为按下）时就预取
  // 目标页面，等真正点击时页面已在本地，直接交换 DOM，不再有等待下载解析的停顿。
  // prefetchAll 让所有站内链接都适用，无需逐个加 data-astro-prefetch。
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  style: {
    scss: {
      includePaths: ["./src/styles"],
    },
  },
  integrations: [
    updateConfig(),
    // 顺序有讲究：react() 必须在 keystatic() 之前（keystatic#1193）。
    ...(withKeystatic ? [react(), keystatic()] : []),
    expressiveCode({
      themes: [CODE_THEME],
      styleOverrides: {
        borderRadius: "0.75rem",
      },
    }),
    mdx(),
    icon(),
    sitemap(),
    tailwind({
      configFile: "./tailwind.config.mjs",
    }),
    playformCompress(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkReadingTime],
      rehypePlugins: [
        rehypeKatex,
        [
          rehypeExternalLinks,
          {
            content: { type: "text", value: "↗" },
          },
        ],
      ],
    }),
  },
  vite: {
    // 注意：不要在这里写 optimizeDeps —— Keystatic 的集成会用 updateConfig 把整个
    // vite.optimizeDeps 覆盖掉（实测放这里无效）。相关的 require/entries 修补统一放在
    // src/integration/keystaticOptimizeDeps.ts，由它排在 keystatic() 之后写回。
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  },
});
