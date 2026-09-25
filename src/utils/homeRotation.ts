/**
 * 首页「轮换方式」的共享定义。
 *
 * 一言卡片与背景壁纸都要按某种节奏换内容，而这个节奏有三个来源：
 *   1. 站点配置 home.config.yaml（默认值）
 *   2. 访客在齿轮面板里的选择（存 localStorage，覆盖默认值）
 *   3. 两边各自的客户端脚本（实际执行）
 * 取值、标签、解析全部收在这一个文件里 —— 分三处写迟早会走样。
 *
 * 取值统一用字符串：
 *   "none"    不轮换（始终第一条 / 始终默认或选中的那张）
 *   "daily"   当天固定一条，次日必换（同一天刷新多少次都一样）
 *   "refresh" 每次打开页面随机一条
 *   "30"      每隔 30 秒（数字字符串，单位秒）
 */

export type RotationKind = "none" | "daily" | "refresh" | "timer";

export interface RotationOption {
  value: string;
  label: string;
}

/** 齿轮面板里的全部轮换方式，按粒度从粗到细排列 */
export const ROTATION_OPTIONS: RotationOption[] = [
  { value: "none", label: "不轮换" },
  { value: "daily", label: "每日" },
  { value: "refresh", label: "每次刷新" },
  { value: "10", label: "10 秒" },
  { value: "30", label: "30 秒" },
  { value: "60", label: "1 分钟" },
  { value: "300", label: "5 分钟" },
  { value: "1800", label: "30 分钟" },
];

const KEYWORDS: RotationKind[] = ["none", "daily", "refresh"];

/**
 * 把任意来源的取值收敛成上面的字符串。
 *
 * `zeroMeans` 决定「0 秒」这种写法被理解成什么，两个调用方要的不一样：
 *   一言：0 → "refresh"。改动前脚本每次进页面都会先随机一条，0 的实际行为就是"每次刷新"，
 *         当初只是文案误写成"不轮换"。
 *   背景：0 → "none"。背景有明确的默认图与访客选中项，0 的语义确实是"不自动轮换"。
 * 保留这个兜底是为了让配置里的裸数字与老访客 localStorage 里的旧值继续生效。
 */
export function normalizeRotation(
  value: unknown,
  zeroMeans: RotationKind = "refresh",
): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? String(value) : zeroMeans;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if ((KEYWORDS as string[]).includes(trimmed)) return trimmed;
    const seconds = Number(trimmed);
    if (Number.isFinite(seconds) && trimmed !== "") {
      return seconds > 0 ? String(seconds) : zeroMeans;
    }
  }

  return zeroMeans;
}

export interface Rotation {
  kind: RotationKind;
  /** 仅 kind 为 "timer" 时有意义 */
  seconds: number;
}

export function parseRotation(
  value: unknown,
  zeroMeans: RotationKind = "refresh",
): Rotation {
  const normalized = normalizeRotation(value, zeroMeans);
  if ((KEYWORDS as string[]).includes(normalized)) {
    return { kind: normalized as RotationKind, seconds: 0 };
  }
  return { kind: "timer", seconds: Number(normalized) || 0 };
}

/**
 * 「每日」用的下标：以本地日期为种子，当天恒定、跨天必换。
 *
 * 用「距 1970 的天数取模」而不是哈希：哈希在相邻两天可能算出同一个值，
 * 那就成了"每日也可能不换"；取模则会在这个池子里按顺序走完一圈再回头。
 * 用 UTC 构造日期再做差，跨时区 / 夏令时都不会偏一天。
 */
export function dailyRotationIndex(date: Date, total: number): number {
  if (total <= 0) return 0;
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return ((dayNumber % total) + total) % total;
}
