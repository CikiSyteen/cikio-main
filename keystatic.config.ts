import { collection, config, fields } from "@keystatic/core";

/**
 * Keystatic 配置（local mode）
 *
 * 只作为「本地可视化写作台」：`pnpm dev` 后访问 http://127.0.0.1:4321/keystatic
 * 直接把内容写回仓库文件，不参与生产构建，也不需要任何后端 / 账号 / 数据库。
 * （构建期由 astro.config.mjs 用 NODE_ENV 判定，只在开发态挂载。）
 *
 * 路径约定与 `src/content.config.ts` 的 blog 集合严格对齐：
 *   - 集合 path 以 `/` 结尾 → 每篇一个目录 `src/content/blog/<slug>/`
 *   - format.contentField   → 元数据写进 index.md[x] 的 frontmatter，正文接在下方
 *   - 字段 key 与 frontmatter 字段名一一对应，改动这里必须同步改 Astro 的 schema
 *
 * 为什么有两个集合：`fields.mdx()` 默认只认 `index.mdx`，`extension: "md"` 才认
 * `index.md`，一个集合的正文扩展名是固定的，所以 .md / .mdx 必须拆成两个集合，
 * 它们指向同一个目录、共用同一套元数据字段，各管各的扩展名。
 *
 * ⚠️ Keystatic 没有「纯 Markdown」字段类型：`fields.mdx` 即使 `extension: "md"`，
 * 正文仍按 **MDX 语义**解析，因此三件事都不能出现在正文里（否则条目会打不开，
 * 报 `Field validation failed: content: ...`）：
 *   1. HTML 标签（`<br>` / `<cite>` / `<abbr>` …）→ `Missing component definition for X`
 *   2. `import` 语句（Keystatic 走静态分析）
 *   3. 裸的 `{}` 表达式（LaTeX 的 `\frac{a}{b}` 会被当成 JSX 表达式）
 * 本仓库 .md 文章现状：
 *   - adding-comment-systems  ✅ 可编辑
 *   - markdown-style-guide    ❌ 含 <br>/<cite>/<abbr> 等 HTML 标签
 *   - mathematics-examples    ❌ LaTeX 大括号被当 JSX 表达式
 * 想编辑后两篇只能把 HTML/大括号改写成 MDX 合法写法（会改动正文），或继续手工编辑文件。
 */

/** 两个集合共用同一套元数据字段，避免两边改一处漏一处 */
const createMetadataFields = () => ({
  title: fields.slug({
    name: { label: "标题" },
    slug: {
      label: "目录名 / 链接",
      description:
        "决定目录 src/content/blog/<slug>/ 与访问路径 /blog/<slug>，已存在的文章不要改",
    },
  }),
  description: fields.text({
    label: "摘要",
    multiline: true,
    description: "用于列表页与 SEO description",
  }),
  pubDate: fields.date({
    label: "发布日期",
    defaultValue: { kind: "today" },
  }),
  updated: fields.date({
    label: "更新时间",
    description: "可选，留空表示未更新过",
  }),
  image: fields.image({
    label: "封面图",
    description:
      "默认写入文章同目录，frontmatter 里保存为相对文件名（与 Astro 的 image() 约定一致）",
  }),
  badge: fields.text({
    label: "角标",
    description: "可选，如「置顶」「LaTeX」",
  }),
  draft: fields.checkbox({
    label: "草稿",
    defaultValue: false,
  }),
  categories: fields.array(fields.text({ label: "分类" }), {
    label: "分类",
    itemLabel: (props) => props.value,
  }),
  tags: fields.array(fields.text({ label: "标签" }), {
    label: "标签",
    itemLabel: (props) => props.value,
  }),
});

const BLOG_PATH = "src/content/blog/*/";
// 写成元组而不是 string[]：Keystatic 的 columns 要求字面量联合类型的键名
const COLUMNS: ["title", "pubDate"] = ["title", "pubDate"];

export default config({
  storage: { kind: "local" },
  ui: {
    brand: { name: "Cikio" },
  },
  collections: {
    // .mdx：可以用 MDX 组件，但正文里不能出现 import（Keystatic 走静态分析）
    blogMdx: collection({
      label: "博客文章（MDX）",
      slugField: "title",
      path: BLOG_PATH,
      format: { contentField: "content" },
      columns: COLUMNS,
      schema: {
        ...createMetadataFields(),
        content: fields.mdx({ label: "正文" }),
      },
    }),
    // .md：纯 Markdown，正文里的 {} 不会被当作 JSX 表达式，适合放 LaTeX
    blogMd: collection({
      label: "博客文章（Markdown）",
      slugField: "title",
      path: BLOG_PATH,
      format: { contentField: "content" },
      columns: COLUMNS,
      schema: {
        ...createMetadataFields(),
        content: fields.mdx({ label: "正文", extension: "md" }),
      },
    }),
  },
});
