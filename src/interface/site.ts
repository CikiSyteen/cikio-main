export interface SubMenuItem {
  id: string;
  text: string;
  href: string;
  svg: string;
  target: string;
}

export interface MenuItem {
  id: string;
  text: string;
  href: string;
  svg: string;
  target: string;
  subItems?: SubMenuItem[];
}

export interface SocialIcon {
  href: string;
  ariaLabel: string;
  title: string;
  svg: string;
}

/** 首页天气小组件的配置（可选，对应 frosti.config.yaml 的 user.weather） */
export interface WeatherConfig {
  /** 是否在首页显示天气行；设为 false 时首页只显示日期与时间 */
  enabled: boolean;
  /** 界面上的城市名，仅作文案，不参与请求 */
  city: string;
  /** 查询用的纬度 / 经度（Open-Meteo） */
  latitude: number;
  longitude: number;
}

export interface BlogConfig {
  pageSize: number;
}

export interface SiteConfig {
  tab: string;
  title: string;
  description: string;
  language: string;
  favicon: string;
  theme: {
    light: string;
    dark: string;
    code: string;
  };
  date_format: string;
  blog: BlogConfig;
  menu: MenuItem[];
}

export interface UserConfig {
  name: string;
  site: string;
  avatar: string;
  /** 个人简介，留空时侧栏与首页都不渲染该行 */
  bio?: string;
  /** 首页天气小组件，未配置时首页只显示日期与时间 */
  weather?: WeatherConfig;
  sidebar: {
    social: SocialIcon[];
  };
  footer: {
    social: SocialIcon[];
  };
}

export interface TranslationLabel {
  noTag: string;
  tagCard: string;
  tagPage: string;
  totalTags: string;
  noCategory: string;
  categoryCard: string;
  categoryPage: string;
  totalCategories: string;
  noPosts: string;
  archivePage: string;
  totalPosts: string;
  link: string;
  prevPage: string;
  nextPage: string;
  wordCount: string;
  readTime: string;
  share: string;
  shareCard: string;
  close: string;
  learnMore: string;
  allTags: string;
  allCategories: string;
  post: string;
  posts: string;
  tagDescription: string;
  categoryDescription: string;
  tagsPageDescription: string;
  categoriesPageDescription: string;
  archivesPageDescription: string;
  backToBlog: string;
}

export interface LanguageTranslation {
  label: TranslationLabel;
}

export interface Translations {
  [language: string]: LanguageTranslation;
}

export interface Config {
  site: SiteConfig;
  user: UserConfig;
}

// ===== 首页（hero）配置：config/home.background.yaml / home.quotes.yaml / home.holidays.yaml =====

export interface HomeBackgroundItem {
  id: string;
  name: string;
  /**
   * public/ 下的路径，不带扩展名（-960 / -1920 两个宽度由组件拼出来）。
   * 与 url 二选一：本地静态图用 path，动态壁纸（必应今日/随机）用 url。
   */
  path?: string;
  /** 动态壁纸的完整图片地址（如 api.bimg.cc 的 302 跳转源），与 path 二选一 */
  url?: string;
}

export interface HomeBackgroundConfig {
  images: HomeBackgroundItem[];
  default?: string;
  /**
   * 轮换方式：none / daily / refresh，或直接写秒数（30 = 每 30 秒）。
   * 裸数字按历史语义理解（背景的 0 = none），解析见 @utils/homeRotation。
   */
  interval?: number | string;
}

export interface HomeQuoteItem {
  text: string;
  author?: string;
}

export interface HomeQuotesConfig {
  items: HomeQuoteItem[];
  /**
   * 轮换方式：none / daily / refresh，或直接写秒数（30 = 每 30 秒）。
   * 裸数字按历史语义理解（一言的 0 = refresh），解析见 @utils/homeRotation。
   */
  interval?: number | string;
}

export interface HomeHolidayEntry {
  name: string;
  /** 单个日期 "YYYY-MM-DD" 或闭区间 "YYYY-MM-DD..YYYY-MM-DD" */
  dates: string[];
}

export interface HomeHolidaysConfig {
  rests?: HomeHolidayEntry[];
  works?: HomeHolidayEntry[];
}

export interface HomeConfig {
  background?: HomeBackgroundConfig;
  quotes?: HomeQuotesConfig;
  holidays?: HomeHolidaysConfig;
}

/** 展开到每一天之后的节假日信息（供日历直接按日期查表） */
export interface HomeHolidayDay {
  name: string;
  type: "rest" | "work";
  /** 是否是该段假期/调休的第一天（只有第一天显示节假日名，其余显示「休」/「班」） */
  first: boolean;
}

export type HomeHolidayMap = Record<string, HomeHolidayDay>;
