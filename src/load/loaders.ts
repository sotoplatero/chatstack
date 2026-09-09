import type { Db } from "../db/index.js";
import { nowIso } from "../db/index.js";
import { normDate, rest, toBool, toInt, toNum, type Row } from "./csv.js";

export interface LoadResult {
  inserted: number;
  updated: number;
  skipped: number;
}

/** Plan normalizado: paid si hay suscripción activa; el plan crudo va a extra.raw_plan. */
export function normalizePlan(row: Row): { plan: string; isActive: number } {
  const active = toBool(row.active_subscription);
  const raw = (row.plan ?? "").trim().toLowerCase();
  const isActive = toBool(row.email_disabled) ? 0 : 1;
  if (active) {
    const plan = raw === "" || raw === "other" ? "paid" : raw;
    return { plan, isActive };
  }
  if (raw === "comp" || raw === "gift" || raw === "founding") return { plan: raw, isActive };
  return { plan: "free", isActive };
}

function tx<T>(db: Db, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function loadEmailList(db: Db, runId: number, rows: Row[]): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const now = nowIso();
  const getSub = db.prepare("SELECT email, plan, plan_since FROM subscribers WHERE email = ?");
  const ins = db.prepare(`INSERT INTO subscribers
    (email, first_seen_at, subscribed_at, source, is_active, plan, plan_since, unsubscribed_at, last_synced_run_id, extra)
    VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?)`);
  const upd = db.prepare(`UPDATE subscribers SET subscribed_at = ?, is_active = ?, plan = ?, plan_since = ?,
    unsubscribed_at = NULL, last_synced_run_id = ?, extra = ? WHERE email = ?`);
  const snap = db.prepare(
    "INSERT OR REPLACE INTO subscriber_snapshots (run_id, email, is_active, plan, extra) VALUES (?, ?, ?, ?, ?)",
  );
  const used = ["email", "active_subscription", "plan", "email_disabled", "created_at", "first_payment_at", "expiry"];

  return tx(db, () => {
    const seen = new Set<string>();
    for (const row of rows) {
      const email = (row.email ?? "").trim().toLowerCase();
      if (!email) {
        res.skipped++;
        continue;
      }
      seen.add(email);
      const { plan, isActive } = normalizePlan(row);
      const extra = JSON.stringify({
        raw_plan: row.plan || undefined,
        expiry: row.expiry || undefined,
        first_payment_at: row.first_payment_at || undefined,
        ...JSON.parse(rest(row, used)),
      });
      const createdAt = normDate(row.created_at);
      const paidSince = normDate(row.first_payment_at);
      const prev = getSub.get(email) as { plan: string; plan_since: string | null } | undefined;
      if (!prev) {
        const planSince = plan === "free" ? createdAt : (paidSince ?? createdAt);
        ins.run(email, now, createdAt, isActive, plan, planSince, runId, extra);
        res.inserted++;
      } else {
        const planSince = prev.plan === plan ? prev.plan_since : plan === "free" ? now : (paidSince ?? now);
        upd.run(createdAt, isActive, plan, planSince, runId, extra, email);
        res.updated++;
      }
      snap.run(runId, email, isActive, plan, extra);
    }
    // Quien estaba activo y ya no aparece en el export se ha dado de baja.
    const stale = db
      .prepare("SELECT email FROM subscribers WHERE is_active = 1 AND last_synced_run_id <> ?")
      .all(runId) as { email: string }[];
    const gone = db.prepare(
      "UPDATE subscribers SET is_active = 0, unsubscribed_at = ?, last_synced_run_id = ? WHERE email = ?",
    );
    const goneSnap = db.prepare(
      "INSERT OR REPLACE INTO subscriber_snapshots (run_id, email, is_active, plan, extra) VALUES (?, ?, 0, 'churned', '{}')",
    );
    for (const { email } of stale) {
      if (seen.has(email)) continue;
      gone.run(now, runId, email);
      goneSnap.run(runId, email);
      res.updated++;
    }
    return res;
  });
}

export function loadPosts(db: Db, _runId: number, rows: Row[]): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT INTO posts (post_id, title, subtitle, post_date, is_published, email_sent_at, type, audience, slug, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(post_id) DO UPDATE SET title=excluded.title, subtitle=excluded.subtitle, post_date=excluded.post_date,
      is_published=excluded.is_published, email_sent_at=excluded.email_sent_at, type=excluded.type, audience=excluded.audience,
      slug=excluded.slug, extra=excluded.extra`);
  const used = ["post_id", "title", "subtitle", "post_date", "is_published", "email_sent_at", "type", "audience"];
  return tx(db, () => {
    for (const row of rows) {
      const id = (row.post_id ?? "").trim();
      if (!id) {
        res.skipped++;
        continue;
      }
      const slug = id.includes(".") ? id.slice(id.indexOf(".") + 1) : null;
      stmt.run(
        id,
        row.title ?? null,
        row.subtitle ?? null,
        normDate(row.post_date),
        toBool(row.is_published) ? 1 : 0,
        normDate(row.email_sent_at),
        row.type ?? null,
        row.audience ?? null,
        slug,
        rest(row, used),
      );
      res.inserted++;
    }
    return res;
  });
}

/** Une email_stats con posts por post_date exacto y, si no, por título. Sin match → post_id sintético "title:<título>". */
export function resolvePostId(db: Db, title: string, postDate: string | null): string {
  if (postDate) {
    const byDate = db.prepare("SELECT post_id FROM posts WHERE post_date = ?").get(postDate) as
      | { post_id: string }
      | undefined;
    if (byDate) return byDate.post_id;
  }
  const byTitle = db
    .prepare("SELECT post_id FROM posts WHERE title = ? ORDER BY post_date DESC LIMIT 1")
    .get(title) as { post_id: string } | undefined;
  if (byTitle) return byTitle.post_id;
  return "title:" + title;
}

export function loadEmailStats(db: Db, runId: number, rows: Row[]): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT OR REPLACE INTO post_email_stats
    (post_id, run_id, title, post_date, audience, views, engagement_rate, signups, subscribes, estimated_value, open_rate, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const used = ["title", "post_date", "audience", "views", "engagement_rate", "signups", "subscribes", "estimated_value", "open_rate"];
  return tx(db, () => {
    for (const row of rows) {
      const title = (row.title ?? "").trim();
      if (!title) {
        res.skipped++;
        continue;
      }
      const postDate = normDate(row.post_date);
      stmt.run(
        resolvePostId(db, title, postDate),
        runId,
        title,
        postDate,
        row.audience ?? null,
        toInt(row.views),
        toNum(row.engagement_rate),
        toInt(row.signups),
        toInt(row.subscribes),
        toNum(row.estimated_value),
        toNum(row.open_rate),
        rest(row, used),
      );
      res.inserted++;
    }
    return res;
  });
}

/** Acceso a columnas insensible a mayúsculas/espacios ("New subscribers" → new_subscribers). */
function col(row: Row, name: string): string | undefined {
  const want = name.toLowerCase().replace(/[\s_]+/g, "");
  for (const [k, v] of Object.entries(row)) if (k.toLowerCase().replace(/[\s_]+/g, "") === want) return v;
  return undefined;
}

export function loadGrowthSources(db: Db, runId: number, rows: Row[]): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT OR REPLACE INTO growth_sources
    (date, source, category, unique_visitors, new_subscribers, new_revenue, run_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      const source = (col(row, "source") ?? "").trim();
      if (!date || !source) {
        res.skipped++;
        continue;
      }
      stmt.run(
        date,
        source,
        col(row, "category") ?? null,
        toInt(col(row, "unique visitors")) ?? 0,
        toInt(col(row, "new subscribers")) ?? 0,
        toNum(col(row, "new revenue")) ?? 0,
        runId,
      );
      res.inserted++;
    }
    return res;
  });
}

export function loadTraffic(db: Db, runId: number, rows: Row[]): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare("INSERT OR REPLACE INTO traffic (date, views, run_id) VALUES (?, ?, ?)");
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      if (!date) {
        res.skipped++;
        continue;
      }
      stmt.run(date, toInt(col(row, "views")) ?? 0, runId);
      res.inserted++;
    }
    return res;
  });
}

export function loadSubscriberGrowth(db: Db, runId: number, rows: Row[], kind: "free" | "paid"): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const freeStmt = db.prepare(`INSERT INTO subscriber_growth_daily (date, new_free, unsubscribes, run_id) VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET new_free=excluded.new_free, unsubscribes=excluded.unsubscribes, run_id=excluded.run_id`);
  const paidStmt = db.prepare(`INSERT INTO subscriber_growth_daily
    (date, new_paid, upgrades, trials_started, cancellations_initiated, cancellations_finalized, run_id) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET new_paid=excluded.new_paid, upgrades=excluded.upgrades, trials_started=excluded.trials_started,
      cancellations_initiated=excluded.cancellations_initiated, cancellations_finalized=excluded.cancellations_finalized, run_id=excluded.run_id`);
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      if (!date) {
        res.skipped++;
        continue;
      }
      if (kind === "free") freeStmt.run(date, toInt(row.new_free), toInt(row.unsubscribes), runId);
      else
        paidStmt.run(
          date,
          toInt(row.new_paid),
          toInt(row.upgrades),
          toInt(row.trials_started),
          toInt(row.cancellations_initiated),
          toInt(row.cancellations_finalized),
          runId,
        );
      res.inserted++;
    }
    return res;
  });
}
