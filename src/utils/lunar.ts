/**
 * 农历日期表（构建期生成，客户端只做下标查询）。
 *
 * 换算用 Node 内置的 Intl 中文历 `zh-CN-u-ca-chinese`，**不引入任何第三方历法库**。
 * Node 24 自带完整 ICU，实测：
 *   2026-09-25 → 八月十五（中秋）
 *   2026-02-17 → 正月初一（春节）
 *   2025-07-25 → 闰六月初一
 *
 * 为什么不在浏览器里直接调 Intl：Safari / Firefox 对非公历日期的支持并不可靠
 * （Firefox 长期缺少非公历 ICU 数据），而日历是按"访客本地当前月"在客户端绘制的。
 * 构建期把一段年份区间算成文本数组，客户端按天偏移取下标即可 —— 几 KB 换掉一个历法库。
 */

const LUNAR_DIGITS = [
  "十",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
];
const LUNAR_TENS = ["初", "十", "廿"];

const chineseCalendar = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
  month: "long",
  day: "numeric",
});

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** 农历日 → 初一 / 十五 / 廿一 / 三十 这种写法（Intl 只给数字，中文写法要自己拼） */
export function lunarDayName(day: number): string {
  if (day === 10) return "初十";
  if (day === 20) return "二十";
  if (day === 30) return "三十";
  const tens = Math.floor(day / 10);
  const ones = day % 10;
  return `${LUNAR_TENS[tens] ?? ""}${LUNAR_DIGITS[ones] ?? ""}`;
}

/** 某一天的农历展示文本：初一显示月份名（八月 / 闰六月），其余显示日名 */
function lunarTextOf(date: Date): string {
  const parts = chineseCalendar.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const dayText = parts.find((part) => part.type === "day")?.value ?? "";
  const day = Number(dayText);
  if (!Number.isFinite(day)) return "";
  // 农历每月第一天，中文日历的惯例是显示月份而不是「初一」
  return day === 1 ? month : lunarDayName(day);
}

export interface LunarTable {
  /** 表的第一天（YYYY-MM-DD），客户端用它把日期换算成下标 */
  start: string;
  /** 自 start 起逐日的农历展示文本 */
  days: string[];
}

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * 生成 [startYear, startYear + yearCount) 这段年份的农历表。
 * 默认从去年开始，这样访客往前翻一个月也有农历可看。
 */
export function buildLunarTable(
  startYear: number,
  yearCount: number,
): LunarTable {
  const start = new Date(startYear, 0, 1);
  const end = new Date(startYear + yearCount, 0, 1);
  const totalDays = Math.round(
    (end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY,
  );

  const days: string[] = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const cursor = new Date(startYear, 0, 1 + offset);
    days.push(lunarTextOf(cursor));
  }

  return { start: toDateKey(start), days };
}

/**
 * 客户端把日期换算成农历表下标的公式（两边必须一致）：
 *
 *   const index = Math.round((Date.UTC(y, m, d) - Date.UTC(startY, startM, startD)) / 86400000)
 *
 * 用 UTC 而不是本地时间做差，跨时区/夏令时都不会偏一位。
 * 这里导出同样的实现，供将来服务端需要时复用。
 */
export function lunarIndexOf(table: LunarTable, date: Date): number {
  const [startYear, startMonth, startDay] = table.start.split("-").map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((dateUtc - startUtc) / MILLISECONDS_PER_DAY);
}
