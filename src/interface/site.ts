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
