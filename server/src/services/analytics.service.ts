import { db } from "../prisma/db.js";

// Sales analytics from the invoices: today, this week and this month in ONE query and ONE response.
// A bill's value is its items x the shop's selling price (the same way the app shows a bill's total).
// Days are India days (Asia/Kolkata, no daylight saving), so "today" starts at midnight there.

const IST_MS = 5.5 * 3600e3;
const HOUR = 3600e3;
const DAY = 24 * HOUR;

type Hour = { t: number; total: number; bills: number; unpaid: number };

export type Period = {
  label: string;
  /** all sales in the period (paid and unpaid bills) */
  total: number;
  bills: number;
  /** the part of `total` that is still unpaid (on the khata) */
  unpaid: number;
  /** the same sales in the period before (yesterday, last week, last month) */
  previous: number;
  /** percent change against `previous`; null when there was nothing before to compare with */
  change: number | null;
  vs: string;
  /** sales per bar, oldest first */
  bars: number[];
  names: string[];
};

const sum = (hours: Hour[], from: number, to: number) =>
  hours
    .filter((h) => h.t >= from && h.t < to)
    .reduce(
      (a, h) => ({
        total: a.total + h.total,
        bills: a.bills + h.bills,
        unpaid: a.unpaid + h.unpaid,
      }),
      { total: 0, bills: 0, unpaid: 0 },
    );

function bars(hours: Hour[], from: number, size: number, count: number) {
  const out = Array.from({ length: count }, () => 0);
  for (const h of hours) {
    const i = Math.floor((h.t - from) / size);
    if (i >= 0 && i < count) out[i] += h.total;
  }
  return out.map((n) => Math.round(n));
}

const pct = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 100) : null;

const round = (n: number) => Math.round(n);

export async function getAnalytics(shopId: string) {
  // "now" as an India wall clock, kept as a plain number (UTC fields = India time)
  const nowLocal = Date.now() + IST_MS;
  const d = new Date(nowLocal);
  const todayStart = Math.floor(nowLocal / DAY) * DAY;
  const weekStart = todayStart - ((d.getUTCDay() + 6) % 7) * DAY; // Monday
  const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const lastMonthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1);
  const lastWeekStart = weekStart - 7 * DAY;
  const daysInMonth = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();

  // one query: the sales of every hour since the earliest start we need
  const from = new Date(
    Math.min(lastMonthStart, lastWeekStart, todayStart - DAY),
  )
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const plan = db.raw.sql`
    WITH bill AS (
      SELECT inv.id, inv.date, inv.payment,
        sum(l.quantity * coalesce(si."sellingPrice", 0)) AS total
      FROM invoices inv
      CROSS JOIN LATERAL jsonb_to_recordset(inv.items::jsonb) AS l(pid uuid, quantity numeric)
      LEFT JOIN shop_inventory si ON si."shopId" = inv."shopId" AND si."productId" = l.pid
      WHERE inv."shopId" = ${shopId}::uuid
        AND inv.date >= (${from}::timestamp AT TIME ZONE 'Asia/Kolkata')
      GROUP BY inv.id
    )
    SELECT to_char(date_trunc('hour', date AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD"T"HH24') AS hour,
      sum(total)::text AS total,
      count(*)::text AS bills,
      coalesce(sum(total) FILTER (WHERE payment = 'LEDGER'), 0)::text AS unpaid
    FROM bill
    GROUP BY 1
    ORDER BY 1
  `
    .returnsRow({
      hour: "pg/text@1",
      total: "pg/text@1",
      bills: "pg/text@1",
      unpaid: "pg/text@1",
    })
    .build();

  const hours: Hour[] = (await db.query(plan)).map((r) => ({
    t: Date.UTC(
      Number(r.hour.slice(0, 4)),
      Number(r.hour.slice(5, 7)) - 1,
      Number(r.hour.slice(8, 10)),
      Number(r.hour.slice(11, 13)),
    ),
    total: Number(r.total),
    bills: Number(r.bills),
    unpaid: Number(r.unpaid),
  }));

  const make = (
    label: string,
    vs: string,
    start: number,
    end: number,
    prevStart: number,
    barList: number[],
    names: string[],
  ): Period => {
    const now = sum(hours, start, end);
    const before = sum(hours, prevStart, start);
    return {
      label,
      total: round(now.total),
      bills: now.bills,
      unpaid: round(now.unpaid),
      previous: round(before.total),
      change: pct(now.total, before.total),
      vs,
      bars: barList,
      names,
    };
  };

  return {
    day: make(
      "today",
      "yesterday",
      todayStart,
      todayStart + DAY,
      todayStart - DAY,
      bars(hours, todayStart, 2 * HOUR, 12), // 12 bars of two hours
      Array.from({ length: 12 }, (_, i) => {
        const h = i * 2;
        return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "am" : "pm"}`;
      }),
    ),
    week: make(
      "this week",
      "last week",
      weekStart,
      weekStart + 7 * DAY,
      lastWeekStart,
      bars(hours, weekStart, DAY, 7),
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    ),
    month: make(
      "this month",
      "last month",
      monthStart,
      monthStart + daysInMonth * DAY,
      lastMonthStart,
      bars(hours, monthStart, DAY, daysInMonth),
      Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
    ),
    // which bar is "now" in each period, so the page can highlight it
    now: {
      day: Math.floor((nowLocal - todayStart) / (2 * HOUR)),
      week: Math.floor((nowLocal - weekStart) / DAY),
      month: Math.floor((nowLocal - monthStart) / DAY),
    },
  };
}
