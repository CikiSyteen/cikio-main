/**
 * 首页壁纸的共享解析与渲染逻辑。
 *
 * 「该显示哪一张」原先在三个地方各写了一遍（HomeBackdrop 的两个脚本 + 站内换页），
 * 三份判断只要有一处走样，就会出现「首屏先画一张、随后又淡入换成另一张」的闪烁。
 * 现在只有一个决策点、一条会话记录：
 *
 *   · 决策点 = BaseLayout 里那段 <head> 的内联脚本。它跑在首屏绘制之前，
 *     是唯一能「在默认图被请求出去之前就改掉地址」的时机。它把结果写成下面这条记录，
 *     并按同一个地址插入 preload —— 于是图片请求从 head 就开始，且只请求正确的那一张。
 *   · 其余所有路径（HomeBackdrop 的解析期内联脚本、astro:page-load 的对账、
 *     站内换页的 before-swap）都只读记录：记录里是什么，就画什么。目标一致时后续
 *     步骤自然 no-op，不会出现「又切了一张」。记录缺失时（换页直接进首页 / 脚本没跑成）
 *     才用 resolveBg 补算一次。
 *
 * 记录为什么能省掉一次下载：动态源（必应）的 URL 带一个「页面打开」级的时间戳。
 * 同一次打开内 URL 恒定，换页回到首页直接命中缓存；硬刷新才换新值，
 * 所以「每次刷新随机一张」「必应随机每次换新」的语义都还在。
 */

import type { HomeBackgroundItem } from "@interfaces/site";
import {
  dailyRotationIndex,
  normalizeRotation,
  parseRotation,
  type Rotation,
} from "./homeRotation";

/** 访客在首页齿轮面板里的选择，与「一言」共用同一个键 */
export const HOME_BG_SETTINGS_KEY = "cikio-home-settings";

/**
 * 本次「页面打开」解析出的那张壁纸。用 sessionStorage 而不是 localStorage：
 * 它只在一个标签页的一次打开里有效，且刷新后还在（复用它才能命中缓存）。
 */
export const HOME_BG_RESOLVED_KEY = "cikio-home-bg-resolved";

/**
 * 「这是一次新的页面打开」的标记：硬刷新 / 直接进入时由 BaseLayout 的解析期脚本写下，
 * 站内换页不写。它决定「目标图要不要重新解析」：每日 / 每次刷新这类轮换得按次重算，
 * 而访客显式选过的那张跨刷新也该复用（URL 一致才有缓存可命中）。
 */
export const HOME_BG_FRESH_KEY = "cikio-home-bg-fresh";

/** 壁纸条目：与 config/home.background.yaml 的 images 一一对应 */
export type HomeBgItem = HomeBackgroundItem;

/** 由 BaseLayout 渲染进 <head> 的配置（data-home-bg-data 里那段 JSON） */
export interface HomeBgPayload {
  backgrounds: HomeBgItem[];
  defaultId: string;
  mode: string;
}

export interface HomeBgSettings {
  bg?: string;
  /** 轮换方式（新键） */
  bgMode?: string;
  /** 轮换方式（旧键）：改动前存的是裸秒数，读的时候必须兜底，否则老访客的选择会被静默重置 */
  bgInterval?: number;
}

/** 本次打开解析出的那张壁纸 */
export interface HomeBgRecord {
  id: string;
  /**
   * 动态源（必应今日/随机）的请求指纹：同一次打开内恒定。
   *
   * 接口的 302 是 no-cache、随机壁纸又必须每次真的换一张，所以「换一张」只能靠
   * URL 不同来保证；反过来，同一次打开内 URL 不变，站内换页回到首页就直接命中缓存
   * —— 不用再等一次跨境的 302 往返。
   */
  stamp: number;
  src: string;
  srcset?: string;
  tint?: string;
}

/** 静态图的两档宽度（响应式取图）；动态壁纸只有一张原图，交回浏览器自己决定 */
export function bgSrcsetOf(item: HomeBgItem): string | undefined {
  return item.path
    ? `${item.path}-960.webp 960w, ${item.path}-1920.webp 1920w`
    : undefined;
}

/** 图片地址；动态源带上本次打开的 stamp，见 HomeBgRecord.stamp 的说明 */
export function bgSrcOf(item: HomeBgItem, stamp: number): string {
  if (!item.url) return `${item.path}-1920.webp`;
  return `${item.url}${item.url.includes("?") ? "&" : "?"}_t=${stamp}`;
}

/** 图片到达前铺在那一层上的占位色（约等于这张图的主色调） */
export function bgTintOf(item: HomeBgItem | undefined): string | undefined {
  return item?.tint || undefined;
}

/**
 * 「每次显示都该换一张」的动态源（必应随机）。
 * 除了 id 以 random 结尾没有别的标记 —— 齿轮面板里那个随机图标用的也是同一套判断。
 * 这类源的 URL 必须在每次「页面打开」时换新，否则刷新后还是同一张，名不副实。
 */
export function isRotatingBg(idOrItem: string | HomeBgItem): boolean {
  const id = typeof idOrItem === "string" ? idOrItem : idOrItem.id;
  return id.endsWith("random");
}

export function readBgSettings(): HomeBgSettings {
  try {
    return JSON.parse(
      window.localStorage.getItem(HOME_BG_SETTINGS_KEY) || "{}",
    );
  } catch {
    return {};
  }
}

/**
 * 从某份文档里读回壁纸配置。默认读当前文档；站内换页时传 event.newDocument，
 * 就能在「新文档还没换上」的时候先把它的壁纸改对（见 BaseLayout）。
 */
export function readBgPayload(
  source: ParentNode = document,
): HomeBgPayload | null {
  const element = source.querySelector<HTMLScriptElement>(
    "[data-home-bg-data]",
  );
  if (!element?.textContent) return null;
  try {
    const payload = JSON.parse(element.textContent) as HomeBgPayload;
    return Array.isArray(payload?.backgrounds) ? payload : null;
  } catch {
    return null;
  }
}

/**
 * 轮换方式：访客设置优先于配置。背景的 0 按「不轮换」理解 ——
 * 与一言不同，它有明确的默认图，0 不该被当成「每次刷新随机」。
 */
export function bgRotationOf(
  payload: Pick<HomeBgPayload, "mode">,
  settings: HomeBgSettings,
): Rotation {
  if (settings.bgMode != null) return parseRotation(settings.bgMode, "none");
  if (settings.bgInterval != null)
    return parseRotation(settings.bgInterval, "none");
  return parseRotation(normalizeRotation(payload.mode, "none"), "none");
}

/** 该显示哪一张：访客显式选过就一直是那张，没选过才交给轮换方式决定 */
export function wantedBgId(
  payload: HomeBgPayload,
  settings: HomeBgSettings,
  date: Date = new Date(),
): string {
  if (payload.backgrounds.some((item) => item.id === settings.bg)) {
    return settings.bg as string;
  }

  const rotation = bgRotationOf(payload, settings);
  const total = payload.backgrounds.length;
  if (total === 0) return payload.defaultId;
  if (rotation.kind === "refresh") {
    return payload.backgrounds[Math.floor(Math.random() * total)].id;
  }
  if (rotation.kind === "daily") {
    return payload.backgrounds[dailyRotationIndex(date, total)].id;
  }
  return payload.defaultId;
}

export function readResolvedBg(): HomeBgRecord | null {
  try {
    const raw = window.sessionStorage.getItem(HOME_BG_RESOLVED_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as HomeBgRecord;
    return typeof record?.id === "string" && typeof record?.src === "string"
      ? record
      : null;
  } catch {
    return null;
  }
}

/** 记下「本次打开显示的是这张」，供换页、预热与后续解析读取 */
export function rememberResolvedBg(
  item: HomeBgItem,
  stamp: number,
): HomeBgRecord {
  const record: HomeBgRecord = {
    id: item.id,
    stamp,
    src: bgSrcOf(item, stamp),
    srcset: bgSrcsetOf(item),
    tint: bgTintOf(item),
  };
  try {
    window.sessionStorage.setItem(HOME_BG_RESOLVED_KEY, JSON.stringify(record));
  } catch {
    /* 隐私模式下不可写：本次会话仍按内存里的值生效 */
  }
  return record;
}

/** 还有一张「新的页面打开」等着被解析吗（换页进首页时用得到） */
function isFreshPageLoad(): boolean {
  try {
    return window.sessionStorage.getItem(HOME_BG_FRESH_KEY) !== null;
  } catch {
    return false;
  }
}

/** 用掉这个标记：谁解析谁负责清，免得后续每次换页都重新解析一遍 */
export function consumeFreshPageLoad(): void {
  try {
    window.sessionStorage.removeItem(HOME_BG_FRESH_KEY);
  } catch {
    /* 忽略 */
  }
}

/**
 * 换图时的时间戳：还是同一张就沿用记录里的值（那就是「同一张图」，不该重新下载），
 * 换成另一张、或这张本身就是「每次都要换新」的随机源，才取当前时间。
 */
export function stampForBg(id: string): number {
  const record = readResolvedBg();
  if (!record || record.id !== id) return Date.now();
  return isRotatingBg(id) ? Date.now() : record.stamp;
}

/**
 * 本次打开已经解析好的、可以继续用的那张。
 *
 * 访客显式选过的那张跨刷新也复用（它和轮换无关，刷新后还是同一张图，
 * URL 一样才有缓存可命中）；但两个例外：
 *  · 「每次显示都该换一张」的随机源，刷新就是要换新；
 *  · 轮换方式选出来的那张只在本轮「页面打开」内复用，
 *    新的页面打开得重新解析，否则「每日 / 每次刷新」就名不副实了。
 */
export function reusableResolvedBg(): HomeBgRecord | null {
  const record = readResolvedBg();
  if (!record) return null;
  const settings = readBgSettings();
  const pinned = settings.bg === record.id && !isRotatingBg(record.id);
  if (pinned) return record;
  return isFreshPageLoad() ? null : record;
}

/**
 * 解析「本次打开该显示哪张」：优先复用记录，其次按设置与轮换重新决定并落记录。
 * 记录缺失的典型场景：从站内其它页第一次换页进首页（本次打开还没解析过）。
 */
export function resolveBg(
  payload: HomeBgPayload,
  date: Date = new Date(),
): { item: HomeBgItem; record: HomeBgRecord } | null {
  const reusable = reusableResolvedBg();
  consumeFreshPageLoad();

  if (reusable) {
    const hit = payload.backgrounds.find((item) => item.id === reusable.id);
    if (hit) return { item: hit, record: reusable };
  }

  const wanted = wantedBgId(payload, readBgSettings(), date);
  const item =
    payload.backgrounds.find((entry) => entry.id === wanted) ??
    payload.backgrounds[0];
  if (!item) return null;

  return { item, record: rememberResolvedBg(item, Date.now()) };
}

/**
 * 把一张壁纸画进某一层。
 *
 * pending = 这一层此刻就是可见的那层（首屏，或站内换页刚换上的新文档）：
 * 先把占位底色铺上、把图片标成「待淡入」，等图片真的到了再淡入 ——
 * 于是任何时刻看到的都是「正确那张图的近似色」，既不会是页面白底，也不会是默认壁纸。
 *
 * 不是 pending 的那层（换图时先塞进隐藏层的那层）不需要图片自己的淡入：
 * 它整层本来就是透明的，等 load 完交给层的透明度做交叉淡入。
 */
export function paintBgLayer(
  layer: HTMLElement | null,
  img: HTMLImageElement | null,
  item: HomeBgItem,
  stamp: number,
  pending: boolean,
): void {
  if (layer) {
    const tint = bgTintOf(item);
    if (tint) layer.style.backgroundColor = tint;
    else layer.style.removeProperty("background-color");
  }
  if (!img) return;

  img.dataset.bgId = item.id;

  // 动态源必须清掉 srcset：留着它浏览器会继续按 100vw 去挑本地图，取不到就一直是空的
  const srcset = bgSrcsetOf(item);
  if (srcset) img.srcset = srcset;
  else img.removeAttribute("srcset");

  if (!pending) {
    img.classList.remove("is-pending");
    img.src = bgSrcOf(item, stamp);
    return;
  }

  // 先标记再赋 src：两者在同一个同步块里完成，浏览器来不及先画一帧原图
  img.classList.add("is-pending");
  const reveal = () => img.classList.remove("is-pending");
  if (img.complete && img.naturalWidth > 0) reveal();
  else img.addEventListener("load", reveal, { once: true });
  img.src = bgSrcOf(item, stamp);
}
