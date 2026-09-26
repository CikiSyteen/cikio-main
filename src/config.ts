import * as fs from "node:fs";
import * as path from "node:path";
import type {
  Config,
  FriendLinksConfig,
  FriendResourcesConfig,
  FriendSitesConfig,
  HomeBackgroundConfig,
  HomeConfig,
  HomeHolidayMap,
  HomeHolidaysConfig,
  HomeQuotesConfig,
  ProjectConfig,
} from "@interfaces/site";
// js-yaml 5 起为纯命名导出（无 default export）
import { load as loadYaml } from "js-yaml";
// 必须用相对路径，不能用 @utils 别名：tailwind.config.mjs 会 import 本文件，
// 而 Tailwind 是被 PostCSS 在 Node 侧加载的，那条链路上没有 Vite 的 tsconfig 别名解析，
// 用别名会直接以 "Cannot find module '@utils/homeRotation'" 中断构建。
import { normalizeRotation } from "./utils/homeRotation";

// 配置文件路径（站点 YAML 配置统一放在 config/ 目录下）
const configPath = path.resolve("config/frosti.config.yaml");
// 页面级配置拆成独立文件，各自可选：缺失时对应模块退回内置空值
// 命名约定：<归属页面>[.<模块>].yaml —— 单模块页面用 project.yaml，
// 一个页面里多块相互独立的数据就按模块拆开（home.* / friend.*）。
const homeBackgroundPath = path.resolve("config/home.background.yaml");
const homeQuotesPath = path.resolve("config/home.quotes.yaml");
const homeHolidaysPath = path.resolve("config/home.holidays.yaml");
const projectPath = path.resolve("config/project.yaml");
const friendLinksPath = path.resolve("config/friend.links.yaml");
const friendSitesPath = path.resolve("config/friend.sites.yaml");
const friendResourcesPath = path.resolve("config/friend.resources.yaml");
// 翻译文件路径
const translationsPath = path.resolve("src/i18n/translations.yaml");
// 读取并解析 YAML 文件
const config = loadYaml(fs.readFileSync(configPath, "utf8")) as Config;
// 读取并解析翻译文件
const translationsConfig = loadYaml(
  fs.readFileSync(translationsPath, "utf8"),
) as Record<string, any>;

// 网站基本信息
export const SITE_TAB = config.site.tab;
export const SITE_TITLE = config.site.title;
export const SITE_DESCRIPTION = config.site.description;
export const SITE_LANGUAGE = config.site.language;
export const SITE_FAVICON = config.site.favicon;
export const SITE_THEME = config.site.theme;
export const DATE_FORMAT = config.site.date_format;

// 博客配置
export const BLOG_CONFIG = config.site.blog;
export const BLOG_PAGE_SIZE = config.site.blog.pageSize;

// 代码块的主题
export const CODE_THEME = config.site.theme.code;

// 用户个人信息
export const USER_NAME = config.user.name;
export const USER_SITE = config.user.site;
export const USER_AVATAR = config.user.avatar;
// 个人简介（侧栏 Profile 卡片与首页，留空则不渲染该行）
export const USER_BIO = config.user.bio ?? "";

// 首页天气小组件（可选；未配置时首页只显示日期与时间）
export const WEATHER_CONFIG = config.user.weather ?? null;

// 社交图标配置（侧边栏和页脚）
export const USER_SIDEBAR_SOCIAL_ICONS = config.user.sidebar.social;
export const USER_FOOTER_SOCIAL_ICONS = config.user.footer.social;

// 网站菜单项配置
export const SITE_MENU = config.site.menu;

// 多语言文本配置
export const TRANSLATIONS = translationsConfig;

// 创建翻译缓存
const translationCache: Record<string, string> = {};

export function t(key: string): string {
  // 检查缓存中是否已存在此翻译
  if (translationCache[key] !== undefined) {
    return translationCache[key];
  }

  // 获取当前语言的翻译
  const currentLangTranslations = TRANSLATIONS[SITE_LANGUAGE];
  if (!currentLangTranslations) {
    translationCache[key] = key; // 缓存结果
    return key;
  }

  // 查找嵌套翻译
  const keyParts = key.split(".");
  let result = currentLangTranslations;

  for (const part of keyParts) {
    if (!result || typeof result !== "object") {
      translationCache[key] = key; // 缓存结果
      return key;
    }

    result = result[part];
  }

  // 保存结果到缓存
  translationCache[key] = typeof result === "string" ? result : key;
  return translationCache[key];
}

// ==================== 首页（hero）配置 ====================

/**
 * 读取一个可选的配置文件：文件不存在就返回兜底值。
 * 页面级配置（首页 / 项目 / 友链）都按这个约定处理，删掉文件等于留空，不会中断构建。
 */
function readOptionalConfig<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return loadYaml(fs.readFileSync(filePath, "utf8")) as T;
}

// 三个独立文件在这里合成同一个 homeConfig，下面的导出与组件都按原结构取用，
// 拆分对上游完全透明。
const homeConfig: HomeConfig = {
  background: readOptionalConfig<HomeBackgroundConfig>(homeBackgroundPath, {
    images: [],
  }),
  quotes: readOptionalConfig<HomeQuotesConfig>(homeQuotesPath, { items: [] }),
  holidays: readOptionalConfig<HomeHolidaysConfig>(homeHolidaysPath, {}),
};

/** 背景图候选列表（访客可在首页齿轮面板里切换） */
export const HOME_BACKGROUNDS = homeConfig.background?.images ?? [];

/** 默认背景 id；配置缺省或指向不存在的 id 时退回第一张 */
export const HOME_BACKGROUND_DEFAULT =
  HOME_BACKGROUNDS.find((item) => item.id === homeConfig.background?.default)
    ?.id ??
  HOME_BACKGROUNDS[0]?.id ??
  "";

/**
 * 背景的默认轮换方式。配置里可以写秒数（30 = 每 30 秒）、
 * 也可以写 none / daily / refresh，解析统一交给 @utils/homeRotation。
 * 背景的 0 按"不轮换"理解：它有明确的默认图与访客选中项，0 的语义确实是"不自动换"。
 */
export const HOME_BACKGROUND_MODE = normalizeRotation(
  homeConfig.background?.interval,
  "none",
);

/** 「一言」的内容池 */
export const HOME_QUOTES = homeConfig.quotes?.items ?? [];

/**
 * 「一言」的默认轮换方式。这里的 0 按"每次刷新"理解：
 * 改动前脚本每次进页面都会先随机一条，0 的实际行为就是每次刷新随机，只是文案误写成"不轮换"。
 */
export const HOME_QUOTE_MODE = normalizeRotation(
  homeConfig.quotes?.interval,
  "refresh",
);

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 把 "2026-01-01" 或 "2026-02-15..2026-02-23" 展开成逐日日期键 */
function expandHolidayRange(spec: string): string[] {
  const [startText, endText] = spec.split("..");
  const start = new Date(`${startText.trim()}T00:00:00`);
  if (Number.isNaN(start.getTime())) return [];
  if (!endText) return [toDateKey(start)];

  const end = new Date(`${endText.trim()}T00:00:00`);
  if (Number.isNaN(end.getTime())) return [toDateKey(start)];

  const keys: string[] = [];
  // 用 setDate 逐日推进而不是加 86400000：跨月/跨年与夏令时都不会算错
  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    keys.push(toDateKey(cursor));
  }
  return keys;
}

/**
 * 法定节假日与调休补班，展开成「日期 → 信息」的查表结构，供日历直接使用。
 * 同一段假期的第一天带 first 标记（日历上只有第一天显示节假日名，其余显示「休」）。
 */
export const HOME_HOLIDAYS: HomeHolidayMap = (() => {
  const map: HomeHolidayMap = {};
  const groups = [
    ["rest", homeConfig.holidays?.rests ?? []],
    ["work", homeConfig.holidays?.works ?? []],
  ] as const;

  for (const [type, entries] of groups) {
    for (const entry of entries) {
      entry.dates.flatMap(expandHolidayRange).forEach((key, index) => {
        map[key] = { name: entry.name, type, first: index === 0 };
      });
    }
  }
  return map;
})();

// ==================== 项目页配置（config/project.yaml） ====================

// 兜底：没有配置文件时 owner 为空，页面各区块自行跳过渲染，只剩标题卡
const projectConfig: ProjectConfig = readOptionalConfig<ProjectConfig>(
  projectPath,
  { owner: "", repos: [] },
) ?? { owner: "", repos: [] };

/** GitHub 用户名：项目页各节仓库与「查看更多」按钮共用 */
export const PROJECT_OWNER = projectConfig.owner;

/** 精选项目的仓库名（不含作者）；为空则该区块不渲染 */
export const PROJECT_FEATURED_REPO = projectConfig.featured?.repo ?? "";

/** 我的仓库列表（仓库名 + 是否置顶） */
export const PROJECT_REPOS = projectConfig.repos ?? [];

/** 底部「在 GitHub 查看更多」按钮（text / url）；为空则不渲染 */
export const PROJECT_MORE = projectConfig.more ?? null;

// ==================== 友链页配置（friend.links / friend.sites / friend.resources） ====================

/** 友链：互换链接的朋友站点（头像 + 简介卡片） */
export const FRIEND_LINKS =
  readOptionalConfig<FriendLinksConfig>(friendLinksPath, { items: [] })
    ?.items ?? [];

/** 友站：渲染成带在线状态检测的小徽章 */
export const FRIEND_SITES =
  readOptionalConfig<FriendSitesConfig>(friendSitesPath, { items: [] })
    ?.items ?? [];

/** 常用资源：渲染成链接卡（字段与 LinkCard 组件对齐） */
export const FRIEND_RESOURCES =
  readOptionalConfig<FriendResourcesConfig>(friendResourcesPath, {
    items: [],
  })?.items ?? [];
