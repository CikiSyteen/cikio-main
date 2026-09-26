---
title: 为 Frosti 添加评论系统
description: 一份完整指南：如何把 Waline 评论系统接入你的 Frosti 博客
pubDate: 04 15 2025
image: ./cover.webp
categories:
  - 文档
tags:
  - Frosti
  - 评论
  - Waline
  - Astro
---

## 引言

评论是博客最核心的能力之一，它让读者能够围绕你的内容展开交流。Frosti 已经为基于 Astro 的博客打下了不错的基础，但要加上评论系统还需要额外几步。本文会带你一步步把 Waline 评论系统接入 Frosti 博客。

像 Astro 构建的这类静态站点没有服务端处理能力，因此并不自带评论系统。不过我们可以借助第三方评论服务：后端由它们托管，我们只需把对应的前端组件集成到站点里。

## 在 Astro 中创建评论组件

在接入具体的评论系统之前，先了解一下 Astro 里组件的创建与使用方式。我们会做一个可复用组件，方便添加到任意页面。

### 组件结构

评论组件放在 `src/components/comments` 目录下。先确认这个目录存在：

```bash
mkdir -p src/components/comments
```

## 集成 Waline

[Waline](https://waline.js.org/) 是一个简单、安全、功能丰富的前后端分离评论系统，可定制程度高，接入也很方便。

### 第一步：搭建 Waline 后端

在把 Waline 加到站点之前，需要先准备好后端：

1. 创建一个 LeanCloud 应用，用来存放评论数据。
2. 把 Waline 服务端部署到 Vercel 或其他托管平台。

按照 [Waline 官方指南](https://waline.js.org/guide/get-started/) 完成后端配置。部署完成后你会得到一个服务端 URL，前端组件需要用到它。

### 第二步：创建 Waline 组件

接下来创建一个可复用的 Waline 组件：

```bash
touch src/components/comments/Waline.astro
```

把下面的代码写进这个组件：

```astro
---
interface Props {
  serverURL: string;
  lang?: string;
  dark?: string;
  emoji?: string[];
  meta?: string[];
  requiredMeta?: string[];
  reaction?: boolean;
  pageview?: boolean;
}

const {
  serverURL,
  lang = "en",
  dark = "html[data-theme-type='dark']",
  emoji = ["https://unpkg.com/@waline/emojis@1.1.0/weibo", "https://unpkg.com/@waline/emojis@1.1.0/bilibili"],
  meta = ["nick", "mail", "link"],
  requiredMeta = [],
  reaction = false,
  pageview = false,
} = Astro.props;
---

<div id="waline-container"></div>

<link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css" />

<script
  type="module"
  define:vars={{
    serverURL,
    lang,
    dark,
    emoji,
    meta,
    requiredMeta,
    reaction,
    pageview,
  }}
>
  import { init } from "https://unpkg.com/@waline/client@v3/dist/waline.js";

  async function initWaline() {
    const container = document.querySelector("#waline-container");
    if (!container) return;

    init({
      el: "#waline-container",
      serverURL,
      path: location.pathname,
      lang,
      dark,
      emoji,
      meta,
      requiredMeta,
      reaction,
      pageview,
    });
  }

  document.addEventListener("astro:page-load", () => {
    initWaline();
  });

  if (document.readyState !== "loading") {
    initWaline();
  } else {
    document.addEventListener("DOMContentLoaded", initWaline);
  }
</script>

<style>
  #waline-container {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }
</style>
```

### 第三步：使用 Waline 组件

现在就可以在 Astro 页面或布局中使用这个 Waline 组件了。下面是把它加到博客文章模板里的写法：

```astro
---
// 在博客文章的布局文件中
import Waline from "../../components/comments/Waline.astro";
// 其他导入与 frontmatter……
---

<!-- 你的博客正文 -->
<article>
  <slot />
</article>

<!-- 添加评论区 -->
<section class="comments">
  <h2>评论</h2>
  <Waline serverURL="https://your-waline-server.vercel.app" />
</section>
```

把 `"https://your-waline-server.vercel.app"` 换成你自己实际的 Waline 服务端 URL。

## 问题排查

### 常见问题

- **评论不显示：** 检查 `serverURL` 是否配置正确并且可以访问。
- **样式异常：** 确认 Waline 的样式表已正常加载。
- **部署问题：** 如果服务端部署在 Vercel，检查环境变量与部署日志。
