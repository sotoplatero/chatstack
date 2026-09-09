import type { Db } from "../db/index.js";

/** Consultas puras sobre la BD. Sin MCP aquí para poder probarlas con una BD en memoria. */

export function getOverview(db: Db) {
  const lastRun = db
    .prepare("SELECT id, started_at, finished_at, status FROM sync_runs WHERE status <> 'running' ORDER BY id DESC LIMIT 1")
    .get() as Record<string, unknown> | undefined;
  const totals = db
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(is_active) AS active,
        SUM(CASE WHEN is_active = 1 AND plan = 'free' THEN 1 ELSE 0 END) AS active_free,
        SUM(CASE WHEN is_active = 1 AND plan <> 'free' THEN 1 ELSE 0 END) AS active_paid,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive
      FROM subscribers`,
    )
    .get();
  const byPlan = db
    .prepare("SELECT plan, COUNT(*) AS n FROM subscribers WHERE is_active = 1 GROUP BY plan ORDER BY n DESC")
    .all();
  const window = (days: number) =>
    db
      .prepare(
        `SELECT COUNT(*) AS new_subscribers FROM subscribers
         WHERE subscribed_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
      )
      .get(`-${days} days`);
  const growth = (days: number) =>
    db
      .prepare(
        `SELECT COALESCE(SUM(new_free),0) AS new_free, COALESCE(SUM(unsubscribes),0) AS unsubscribes,
                COALESCE(SUM(new_paid),0) AS new_paid, COALESCE(SUM(cancellations_finalized),0) AS cancellations
         FROM subscriber_growth_daily WHERE date >= date('now', ?)`,
      )
      .get(`-${days} days`);
  const posts = db.prepare("SELECT COUNT(*) AS total, SUM(is_published) AS published FROM posts").get();
  const totalsSeries = db
    .prepare("SELECT date, total_subscribers FROM subscriber_totals ORDER BY date DESC LIMIT 1")
    .get() ?? null;
  return {
    latest_total_from_series: totalsSeries,
    last_sync: lastRun ?? null,
    subscribers: totals,
    active_by_plan: byPlan,
    new_subscribers_from_list: { last_30d: window(30), last_90d: window(90) },
    growth_daily_totals: { last_30d: growth(30), last_90d: growth(90) },
    posts,
  };
}

export interface SubscriberFilter {
  plan?: string;
  is_active?: boolean;
  subscribed_after?: string;
  subscribed_before?: string;
  email_contains?: string;
  limit?: number;
  offset?: number;
}

export function listSubscribers(db: Db, f: SubscriberFilter) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.plan) {
    if (f.plan === "paid") where.push("plan <> 'free'");
    else {
      where.push("plan = ?");
      args.push(f.plan);
    }
  }
  if (f.is_active !== undefined) {
    where.push("is_active = ?");
    args.push(f.is_active ? 1 : 0);
  }
  if (f.subscribed_after) {
    where.push("subscribed_at >= ?");
    args.push(f.subscribed_after);
  }
  if (f.subscribed_before) {
    where.push("subscribed_at < ?");
    args.push(f.subscribed_before);
  }
  if (f.email_contains) {
    where.push("email LIKE ?");
    args.push(`%${f.email_contains}%`);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 500);
  const offset = Math.max(f.offset ?? 0, 0);
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM subscribers ${w}`).get(...(args as any[])) as { n: number }).n;
  const rows = db
    .prepare(
      `SELECT email, plan, is_active, subscribed_at, plan_since, unsubscribed_at, extra
       FROM subscribers ${w} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...(args as any[]), limit, offset)
    .map(withExtra);
  return { total, limit, offset, rows };
}

export function getSubscriber(db: Db, email: string) {
  const sub = db.prepare("SELECT * FROM subscribers WHERE email = ?").get(email.trim().toLowerCase()) as
    | Record<string, unknown>
    | undefined;
  if (!sub) return null;
  const history = db
    .prepare(
      `SELECT s.run_id, r.started_at AS synced_at, s.plan, s.is_active
       FROM subscriber_snapshots s JOIN sync_runs r ON r.id = s.run_id
       WHERE s.email = ? ORDER BY s.run_id`,
    )
    .all(sub.email as string);
  return { ...withExtra(sub), history };
}

/**
 * Candidatos a pago: free activos ordenados por engagement real del export de Substack
 * (extra.activity 0-5, emails abiertos en 30d, días activos en 30d), con antigüedad como desempate.
 * Si la BD solo tiene el export legado (sin engagement), degrada a proxy por antigüedad y lo declara.
 */
export function findUpgradeCandidates(db: Db, limit = 50, minDaysSubscribed = 14) {
  const rows = db
    .prepare(
      `SELECT email, subscribed_at, plan_since, source, extra,
              CAST(julianday('now') - julianday(subscribed_at) AS INTEGER) AS days_subscribed,
              json_extract(extra, '$.activity') AS activity,
              json_extract(extra, '$.emails_opened_30d') AS emails_opened_30d,
              json_extract(extra, '$.days_active_30d') AS days_active_30d,
              json_extract(extra, '$.post_views_30d') AS post_views_30d
       FROM subscribers
       WHERE is_active = 1 AND plan = 'free' AND subscribed_at IS NOT NULL
         AND julianday('now') - julianday(subscribed_at) >= ?
       ORDER BY
         COALESCE(json_extract(extra, '$.activity'), -1) DESC,
         COALESCE(json_extract(extra, '$.emails_opened_30d'), -1) DESC,
         COALESCE(json_extract(extra, '$.days_active_30d'), -1) DESC,
         subscribed_at ASC
       LIMIT ?`,
    )
    .all(minDaysSubscribed, Math.min(Math.max(limit, 1), 500))
    .map(withExtra);
  const hasEngagement = rows.some((r: any) => r.activity !== null && r.activity !== undefined);
  return {
    method: hasEngagement
      ? "engagement real por contacto: activity (0-5), emails_opened_30d, days_active_30d; antigüedad como desempate"
      : "PROXY: la BD no tiene engagement individual (export legado); ordenado por antigüedad entre free activos",
    min_days_subscribed: minDaysSubscribed,
    count: rows.length,
    rows,
  };
}

export function getPostPerformance(db: Db, sort: "open_rate" | "views" | "subscribes" | "signups" | "post_date" = "post_date", limit = 50) {
  const col = { open_rate: "s.open_rate", views: "s.views", subscribes: "s.subscribes", signups: "s.signups", post_date: "s.post_date" }[sort];
  return db
    .prepare(
      `WITH latest AS (
         SELECT post_id, MAX(run_id) AS run_id FROM post_email_stats GROUP BY post_id
       )
       SELECT s.post_id, COALESCE(p.title, s.title) AS title, p.subtitle, s.post_date, p.type,
              COALESCE(p.audience, s.audience) AS audience, p.is_published,
              s.views, s.open_rate, s.engagement_rate, s.signups, s.subscribes, s.estimated_value
       FROM post_email_stats s
       JOIN latest l ON l.post_id = s.post_id AND l.run_id = s.run_id
       LEFT JOIN posts p ON p.post_id = s.post_id
       ORDER BY ${col} DESC NULLS LAST
       LIMIT ?`,
    )
    .all(Math.min(Math.max(limit, 1), 500));
}

export function getGrowth(db: Db, from?: string, to?: string, groupBy: "day" | "week" | "month" | "source" = "month") {
  const where: string[] = [];
  const args: unknown[] = [];
  if (from) {
    where.push("date >= ?");
    args.push(from);
  }
  if (to) {
    where.push("date <= ?");
    args.push(to);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const bucket = {
    day: "date",
    week: "strftime('%Y-W%W', date)",
    month: "substr(date, 1, 7)",
    source: "source",
  }[groupBy];
  const bySource = db
    .prepare(
      `SELECT ${bucket} AS bucket, ${groupBy === "source" ? "MAX(category)" : "'all'"} AS category,
              SUM(unique_visitors) AS unique_visitors, SUM(new_subscribers) AS new_subscribers, SUM(new_revenue) AS new_revenue
       FROM growth_sources ${w} GROUP BY bucket ORDER BY ${groupBy === "source" ? "new_subscribers DESC" : "bucket"}`,
    )
    .all(...(args as any[]));
  const daily =
    groupBy === "source"
      ? []
      : db
          .prepare(
            `SELECT ${bucket} AS bucket, SUM(new_free) AS new_free, SUM(unsubscribes) AS unsubscribes,
                    SUM(new_paid) AS new_paid, SUM(upgrades) AS upgrades, SUM(cancellations_finalized) AS cancellations
             FROM subscriber_growth_daily ${w} GROUP BY bucket ORDER BY bucket`,
          )
          .all(...(args as any[]));
  return { group_by: groupBy, from: from ?? null, to: to ?? null, growth_sources: bySource, subscriber_growth: daily };
}

export function getChurn(db: Db, from?: string, to?: string) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (from) {
    where.push("unsubscribed_at >= ?");
    args.push(from);
  }
  if (to) {
    where.push("unsubscribed_at <= ?");
    args.push(to);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "WHERE unsubscribed_at IS NOT NULL";
  const churned = db
    .prepare(`SELECT email, plan, subscribed_at, unsubscribed_at FROM subscribers ${w} ORDER BY unsubscribed_at DESC LIMIT 500`)
    .all(...(args as any[]));
  // Transiciones de plan entre snapshots consecutivos.
  const transitions = db
    .prepare(
      `SELECT a.email, a.plan AS from_plan, b.plan AS to_plan, r.started_at AS changed_at
       FROM subscriber_snapshots a
       JOIN subscriber_snapshots b ON b.email = a.email
         AND b.run_id = (SELECT MIN(run_id) FROM subscriber_snapshots WHERE email = a.email AND run_id > a.run_id)
       JOIN sync_runs r ON r.id = b.run_id
       WHERE a.plan <> b.plan ${from ? "AND r.started_at >= ?" : ""} ${to ? "AND r.started_at <= ?" : ""}
       ORDER BY r.started_at DESC LIMIT 500`,
    )
    .all(...([from, to].filter(Boolean) as any[]));
  const summary = {
    churned: churned.length,
    upgrades: transitions.filter((t: any) => t.from_plan === "free" && t.to_plan !== "free" && t.to_plan !== "churned").length,
    downgrades: transitions.filter((t: any) => t.from_plan !== "free" && t.to_plan === "free").length,
  };
  return { summary, churned, transitions };
}

export function getSchema(db: Db) {
  const tables = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as { name: string; sql: string }[];
  const counts = Object.fromEntries(
    tables.map((t) => [t.name, (db.prepare(`SELECT COUNT(*) AS n FROM ${t.name}`).get() as { n: number }).n]),
  );
  return { tables: tables.map((t) => ({ name: t.name, rows: counts[t.name], ddl: t.sql })) };
}

const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|replace|attach|detach|pragma|vacuum|reindex)\b/i;

export function querySql(db: Db, sql: string, maxRows = 200) {
  const trimmed = sql.trim().replace(/;+$/, "");
  if (!/^\s*(select|with)\b/i.test(trimmed)) throw new Error("Solo se permiten sentencias SELECT / WITH.");
  if (FORBIDDEN.test(trimmed)) throw new Error("La consulta contiene palabras clave de escritura; solo lectura.");
  if (trimmed.includes(";")) throw new Error("Una sola sentencia por consulta.");
  const limited = /\blimit\b/i.test(trimmed) ? trimmed : `${trimmed} LIMIT ${maxRows}`;
  const rows = db.prepare(limited).all();
  return { row_count: rows.length, truncated_at: /\blimit\b/i.test(trimmed) ? null : maxRows, rows };
}

function withExtra<T extends Record<string, unknown>>(row: T): T {
  if (typeof row.extra === "string") {
    try {
      return { ...row, extra: JSON.parse(row.extra) };
    } catch {
      return row;
    }
  }
  return row;
}
