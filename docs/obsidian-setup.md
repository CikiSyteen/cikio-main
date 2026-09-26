# 用 Obsidian 写作（本地优先）

面向本仓库的写作环境配置。目标：在**任何 MDX 语法都保真**的前提下，获得比 VS Code 更舒服的写作体验，并且写完能自动提交回 git。

## 为什么选它

1. **对内容 100% 保真。** Obsidian 只把仓库当普通文本文件读写，**不解析 MDX AST**。而结构化编辑器（如 Keystatic）会先把你文件解析成组件树才能显示，于是含 `import` 语句、HTML 标签（`<br>` / `<cite>`）、LaTeX 大括号（`{}`）的文件直接打不开。当前仓库 5 篇文章里只有 2 篇能在 Keystatic 里编辑，**Obsidian 里 5 篇全能写**。
2. **天然吻合本仓库的目录约定。** 每篇一个目录（`src/content/blog/<slug>/index.mdx`）+ 封面同目录（`cover.webp`）。下一步的「附件位置」设置一次性配好即可。
3. **零后端、零部署改动。** 不碰 `astro.config.mjs`、不碰 Cloudflare Pages 配置、不引入任何依赖。

## 一次性配置（约 30 分钟）

### 1. Vault 指向仓库根

用 Obsidian 打开 `D:\Code\MyProjects\cikio-main` 作为 vault。

> Vault 必须是 git 仓库根目录，`Git` 插件才能正常工作。

首次打开会索引整个仓库；`node_modules` 里有大量 README，按下一步排除掉。

### 2. 排除干扰目录

`设置 → 文件与链接 → 已排除的文件`（Settings → Files and links → Excluded files），逐条加入：

```
node_modules
dist
fuwari-main
image
public/pagefind
```

以 `.` 开头的目录（`.git` / `.astro` / `.obsidian`）Obsidian 会自动忽略，无需处理。

### 3. 让附件落到文章同目录（关键）

`设置 → 文件与链接 → 新附件的默认位置` → 选 **「与当前文件相同的文件夹」**
（Settings → Files and links → Default location for new attachments → **Same folder as current file**）

这一条决定了 `cover.webp` 能和 `index.mdx` 待在同一目录，从而 frontmatter 里可以写相对路径 `image: ./cover.webp` 并通过 Astro 的 `image()` 校验。

### 4. 安装两个社区插件

`设置 → 第三方插件 → 关闭「受限模式」`（Settings → Community plugins → Turn off Restricted mode），然后浏览安装：

| 插件 | 作用 | 必要性 |
| --- | --- | --- |
| `mdx as md` | 让 Obsidian 把 `.mdx` 当 Markdown 打开（Obsidian 默认只认 `.md`） | **必须** |
| `Git`（obsidian-git） | 定时自动 commit + pull + push | **必须** |

可选：`MDX`（在 Obsidian 内直接预览 JSX），`Templater`（比核心「模板」插件更强，核心的已够用）。

### 5. obsidian-git 推荐设置

| 设置项 | 建议值 | 说明 |
| --- | --- | --- |
| Auto pull on startup | 开 | 打开 Obsidian 先拉取，避免和 VS Code 的改动打架 |
| Auto commit-and-sync interval | `10` | 单位分钟，也可改用手动 |
| Disable push | 关 | 保持开启才能自动推送到远端 |
| 认证方式 | HTTPS + Personal Access Token | 本机已配好 git 凭据的话可直接复用 |

`.gitignore` 已经忽略 `.obsidian/`，插件二进制和工作区状态不会进仓库。

## 写一篇新文章

1. 新建目录 `src/content/blog/<slug>/`（`<slug>` 用英文短名，它直接决定访问路径 `/blog/<slug>`，发布后不要再改）
2. 在该目录执行「插入模板」，模板选 `docs/templates/obsidian-post.md`，保存为 `index.mdx`
3. 把封面图拖进同一目录并命名为 `cover.webp`，然后取消模板里 `# image: ./cover.webp` 那行的注释
4. 正常写正文；MDX 组件（`<Collapse>`、`<LinkCard>`、`<GitHubStats>` 等）直接写标签即可
5. 发布前把 `draft` 改成 `false`（或删掉该行）
6. 等自动提交，或手动执行命令面板里的 `Git: Commit-and-sync`

## frontmatter 字段

与 `src/content.config.ts` 的 schema 一一对应：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 文章标题 |
| `description` | ✅ | 列表页摘要 + SEO description，**不能为空**（写成空值会让构建失败） |
| `pubDate` | ✅ | 发布日期。`2026-09-26` 或 `Jul 02 2022` 这类写法都可以（由 `z.coerce.date()` 解析） |
| `updated` | | 更新日期，可选 |
| `image` | | 封面图，**必须是相对路径**，如 `./cover.webp`（由 `image()` 校验并交给 astro:assets 优化） |
| `badge` | | 角标，如「置顶」「LaTeX」 |
| `draft` | | 默认 `false`；为 `true` 时**仅在正式构建**中被过滤（本地 `pnpm dev` 仍可见，方便边写边看） |
| `categories` / `tags` | | 字符串数组；**同一数组内不能有重复项**（schema 有唯一性校验，重复会导致构建失败） |

## 发布流程

Obsidian 只负责「写文件 + 提交」，发布沿用本仓库既有的预览分支约定：

```bash
git switch -c <feature>-preview   # 需要预览时切分支；单篇小改也可直接提交
# 写完后 commit & push
# Cloudflare Pages 自动生成预览 URL 验收
pnpm release:main                 # 验收通过后转正到 main
```

细节见 `scripts/publish-preview-to-main.sh`。

## 已知限制

1. **Obsidian 的预览不认识 Astro 组件**，会显示原始 `<Collapse ...>` 标签。真实渲染请把 `pnpm dev` 开着看浏览器（Astro 热更新，存盘即刷新），不要用 Obsidian 预览做验收。
2. **手机端 obsidian-git 实操上是手动 pull / push**（只有桌面端能做全自动定时同步）。手机上适合写草稿，发布回桌面点一下即可。
3. 与 VS Code 共用同一个仓库时，避免两边同时改同一个文件；打开 `Auto pull on startup` 基本够用。
4. 模板里的 `{{date:YYYY-MM-DD}}` 是 Obsidian 核心「模板」插件的占位符，只在**插入模板时**被替换为当天日期。
5. Vault 即仓库根，Obsidian 会把仓库里所有 Markdown 都纳入索引；已经用「已排除的文件」降低噪音，首次索引仍可能稍慢。

## 与其他方案的关系

- **Keystatic**（在 `keystatic-preview` 分支，未合入 main）：结构化的 MDX 可视化编辑器，适合写「干净的新文章」，但无法处理含 `import` / HTML 标签 / LaTeX 大括号的文件。与 Obsidian 不冲突，可并存。
- **Pages CMS**：如果将来要把写作交给不写代码的人，再考虑引入 `/admin` 网页后台；注意其媒体路径配置需要针对本仓库的「封面与文章同目录」约定做实测。
