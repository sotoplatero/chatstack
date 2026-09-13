import type { Db } from "./db/index.js";

/** Consultas puras sobre la BD. Sin MCP aquí para poder probarlas con una BD en memoria. */

/**
 * Planes que representan dinero entrante. El autor de la publicación aparece en el export con
 * plan `author`, y los regalos y cortesías con `comp`/`gift`: ninguno paga, así que contarlos como
 * «de pago» inflaba el único dato del que cuelga cualquier decisión de negocio. `plan <> 'free'`
 * decía que había 1 suscriptor de pago en una base donde ese 1 es el propio usuario.
 */
const PAID_PLANS = ["monthly", "yearly", "paid", "founding"] as const;
const PAID_SQL = `plan IN (${PAID_PLANS.map((p) => `'${p}'`).join(", ")})`;
/** No cobra pero tampoco es free: autor, cortesías, regalos. Se cuenta aparte, nunca como ingreso. */
const OTHER_SQL = `plan <> 'free' AND NOT (${PAID_SQL})`;

/**
 * Semántica única de rangos de fecha en todas las consultas: `--from` incluye el día entero y
 * `--to` también. Antes convivían `<=` sobre marcas ISO con hora (que excluía el propio día `to`,
 * porque `'2026-09-09T04:00Z' > '2026-09-09'`) y `<` sobre fechas sueltas. Comparar contra
 * `date(to, '+1 day')` funciona igual con `YYYY-MM-DD` y con marcas ISO completas.
 */
function dateRange(col: string, from?: string, to?: string): { sql: string; args: string[] } {
  const parts: string[] = [];
  const args: string[] = [];
  if (from) {
    parts.push(`${col} >= ?`);
    args.push(from);
  }
  if (to) {
    parts.push(`${col} < date(?, '+1 day')`);
    args.push(to);
  }
  return { sql: parts.length ? parts.join(" AND ") : "1=1", args };
}

/**
 * Claves de `extra` que Substack exporta como texto. En SQLite un INTEGER siempre es menor que
 * cualquier TEXT, así que `'6' = 6` es falso y `'6' >= 6` es verdadero SIEMPRE, para cualquier
 * valor: la comparación no comparaba nada. Todo lo que salga de estas claves va casteado.
 */
const SEEN_6MO = `CAST(json_extract(extra, '$."Unique emails seen (6mo)"') AS INTEGER)`;
const SEEN_30D = `CAST(json_extract(extra, '$."Unique emails seen (30d)"') AS INTEGER)`;
const RECEIVED_6MO = `json_extract(extra, '$.emails_received_6mo')`;
/** Aperturas únicas sobre correos recibidos. NULL si no recibió ninguno: no es un 0%, es «no se sabe». */
const OPEN_RATIO = `CASE WHEN COALESCE(${RECEIVED_6MO}, 0) > 0 THEN 1.0 * COALESCE(${SEEN_6MO}, 0) / ${RECEIVED_6MO} END`;

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
        SUM(CASE WHEN is_active = 1 AND ${PAID_SQL} THEN 1 ELSE 0 END) AS active_paid,
        SUM(CASE WHEN is_active = 1 AND ${OTHER_SQL} THEN 1 ELSE 0 END) AS active_other,
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
  // Serie diaria del panel: SUM(...) sin COALESCE, porque un tramo sin filas debe verse como null
  // («no hay serie para esas fechas») y no como un 0 que se lea como «no hubo altas».
  const growthDaily = (days: number) =>
    db
      .prepare(
        `SELECT COUNT(*) AS days_with_data, SUM(new_free) AS new_free_daily, SUM(unsubscribes) AS unsubscribes_daily,
                SUM(new_paid) AS new_paid_daily, SUM(cancellations_finalized) AS cancellations_daily
         FROM subscriber_growth_daily WHERE date >= date('now', ?)`,
      )
      .get(`-${days} days`);
  // Altas atribuidas a una fuente de captación. Es otra cifra: cuenta visitas convertidas por
  // origen, no filas de la lista, y los dos números no tienen por qué cuadrar.
  const growthSources = (days: number) =>
    db
      .prepare(
        `SELECT COUNT(*) AS rows_with_data, SUM(new_subscribers) AS new_subscribers_attributed,
                SUM(unique_visitors) AS unique_visitors
         FROM growth_sources WHERE date >= date('now', ?)`,
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
    // Tres formas distintas de contar «altas», con el origen en el nombre para que nadie las sume.
    new_subscribers_from_list: { last_30d: window(30), last_90d: window(90) },
    new_from_growth_daily_series: { last_30d: growthDaily(30), last_90d: growthDaily(90) },
    new_from_growth_sources: { last_30d: growthSources(30), last_90d: growthSources(90) },
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
    // `paid` ya no es «todo lo que no es free»: el autor, las cortesías y los regalos salen con
    // `--plan other`. Un plan concreto (monthly, yearly…) se filtra tal cual.
    if (f.plan === "paid") where.push(PAID_SQL);
    else if (f.plan === "other") where.push(OTHER_SQL);
    else {
      where.push("plan = ?");
      args.push(f.plan);
    }
  }
  if (f.is_active !== undefined) {
    where.push("is_active = ?");
    args.push(f.is_active ? 1 : 0);
  }
  // Mismo criterio que el resto de consultas: ambos extremos incluyen el día entero.
  if (f.subscribed_after || f.subscribed_before) {
    const r = dateRange("subscribed_at", f.subscribed_after, f.subscribed_before);
    where.push(r.sql);
    args.push(...r.args);
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
 * Señales de la puntuación de candidatos, con el peso que aporta cada una y cómo se lee en `extra`.
 * Están declaradas en un sitio porque `method` se construye desde aquí: antes el texto prometía
 * «emails_opened_30d, days_active_30d» aunque esas claves estuvieran a null en toda la base, y el
 * orden salía realmente solo de `activity`. Ahora `method` solo nombra lo que tenía datos.
 */
const CANDIDATE_SIGNALS: { key: string; label: string; expr: string; term: string }[] = [
  { key: "activity", label: "activity (0-5)", expr: "json_extract(extra, '$.activity')", term: "COALESCE(json_extract(extra, '$.activity'), 0) * 2.0" },
  { key: "open_ratio_6mo", label: "ratio de aperturas únicas (6mo)", expr: OPEN_RATIO, term: `COALESCE(${OPEN_RATIO}, 0) * 5.0` },
  { key: "links_clicked", label: "clics en enlaces", expr: "json_extract(extra, '$.links_clicked')", term: "MIN(COALESCE(json_extract(extra, '$.links_clicked'), 0), 20) * 0.25" },
  { key: "comments", label: "comentarios", expr: "json_extract(extra, '$.comments')", term: "MIN(COALESCE(json_extract(extra, '$.comments'), 0), 10) * 0.5" },
  { key: "shares", label: "shares", expr: "json_extract(extra, '$.shares')", term: "MIN(COALESCE(json_extract(extra, '$.shares'), 0), 10) * 0.5" },
];

/** Penalización por apertura antigua: quien no abre desde hace meses no es candidato a pagar. */
const STALENESS_PENALTY = `
  CASE
    WHEN json_extract(extra, '$.last_email_open') IS NULL THEN 3.0
    WHEN julianday('now') - julianday(json_extract(extra, '$.last_email_open')) > 90 THEN 3.0
    WHEN julianday('now') - julianday(json_extract(extra, '$.last_email_open')) > 60 THEN 2.0
    WHEN julianday('now') - julianday(json_extract(extra, '$.last_email_open')) > 30 THEN 1.0
    ELSE 0.0
  END`;

/**
 * Candidatos a pago: free activos puntuados con las señales que la base tiene de verdad. La
 * antigüedad sigue siendo el desempate, no un criterio: llevar dos años sin abrir un correo no
 * convierte a nadie en candidato.
 */
export function findUpgradeCandidates(db: Db, limit = 50, minDaysSubscribed = 14) {
  const score = `${CANDIDATE_SIGNALS.map((s) => s.term).join(" + ")} - ${STALENESS_PENALTY}`;
  const cols = CANDIDATE_SIGNALS.map((s) => `${s.expr} AS ${s.key}`).join(",\n              ");
  const rows = db
    .prepare(
      `SELECT email, subscribed_at, plan_since, source, extra,
              CAST(julianday('now') - julianday(subscribed_at) AS INTEGER) AS days_subscribed,
              ${cols},
              ${RECEIVED_6MO} AS emails_received_6mo,
              ${SEEN_6MO} AS unique_emails_seen_6mo,
              json_extract(extra, '$.last_email_open') AS last_email_open,
              CAST(julianday('now') - julianday(json_extract(extra, '$.last_email_open')) AS INTEGER) AS days_since_last_open,
              ROUND(${score}, 3) AS score,
              ROUND(${STALENESS_PENALTY}, 3) AS staleness_penalty
       FROM subscribers
       WHERE is_active = 1 AND plan = 'free' AND subscribed_at IS NOT NULL
         AND julianday('now') - julianday(subscribed_at) >= ?
       ORDER BY score DESC, subscribed_at ASC
       LIMIT ?`,
    )
    .all(minDaysSubscribed, Math.min(Math.max(limit, 1), 500))
    .map(withExtra);
  // Qué señales existen de verdad se mide sobre toda la población free activa, no sobre la página
  // devuelta: con --limit 5 la muestra podría no ser representativa.
  const avail = db
    .prepare(
      `SELECT ${CANDIDATE_SIGNALS.map((s) => `COUNT(${s.expr}) AS ${s.key}`).join(", ")},
              COUNT(json_extract(extra, '$.last_email_open')) AS last_email_open
       FROM subscribers WHERE is_active = 1 AND plan = 'free'`,
    )
    .get() as Record<string, number>;
  const used = CANDIDATE_SIGNALS.filter((s) => avail[s.key] > 0).map((s) => s.label);
  if (avail.last_email_open > 0) used.push("penalización por última apertura antigua");
  const missing = CANDIDATE_SIGNALS.filter((s) => !avail[s.key]).map((s) => s.label);
  return {
    method: used.length
      ? `puntuación sobre free activos con: ${used.join(", ")}; antigüedad solo como desempate` +
        (missing.length ? `. Sin datos en esta base (no puntúan): ${missing.join(", ")}` : "")
      : "PROXY: la base no tiene ninguna señal de engagement individual; solo se ordena por antigüedad",
    signals_available: avail,
    min_days_subscribed: minDaysSubscribed,
    count: rows.length,
    rows,
  };
}

/**
 * Ratios derivados. Todos con el denominador protegido: si no hay base, el resultado es NULL, no 0.
 * Un 0 aquí se leería como «este post no convierte», cuando lo cierto es que no hay dato.
 */
const POST_RATIOS = `
  CASE WHEN s.views > 0 THEN 1000.0 * s.signups / s.views END AS signups_per_1k_views,
  CASE WHEN s.views > 0 THEN 1000.0 * s.subscribes / s.views END AS subscribes_per_1k_views,
  CASE WHEN s.delivered > 0 THEN 1.0 * s.unsubscribes / s.delivered END AS unsubscribe_rate,
  CASE WHEN s.opened > 0 THEN 1.0 * s.clicked / s.opened END AS click_to_open_rate,
  CASE WHEN s.sent > 0 THEN 1.0 * s.delivered / s.sent END AS delivery_rate`;

export const POST_SORT_COLUMNS: Record<string, string> = {
  post_date: "s.post_date",
  open_rate: "s.open_rate",
  views: "s.views",
  subscribes: "s.subscribes",
  signups: "s.signups",
  engagement_rate: "s.engagement_rate",
  sent: "s.sent",
  delivered: "s.delivered",
  opens: "s.opens",
  opened: "s.opened",
  clicks: "s.clicks",
  clicked: "s.clicked",
  click_rate: "s.click_rate",
  likes: "s.likes",
  comments: "s.comments",
  shares: "s.shares",
  restacks: "s.restacks",
  unsubscribes: "s.unsubscribes",
  wordcount: "p.wordcount",
  signups_per_1k_views: "signups_per_1k_views",
  click_to_open_rate: "click_to_open_rate",
};

export type PostSort = keyof typeof POST_SORT_COLUMNS;

export function getPostPerformance(db: Db, sort: string = "post_date", limit = 50, from?: string, to?: string) {
  const col = POST_SORT_COLUMNS[sort] ?? POST_SORT_COLUMNS.post_date;
  const r = dateRange("s.post_date", from, to);
  return db
    .prepare(
      `WITH latest AS (
         SELECT post_id, MAX(run_id) AS run_id FROM post_email_stats GROUP BY post_id
       )
       SELECT s.post_id, COALESCE(p.title, s.title) AS title, p.subtitle, s.post_date, p.type, p.slug, p.wordcount,
              COALESCE(p.audience, s.audience) AS audience, p.is_published, p.email_sent_at,
              s.views, s.open_rate, s.engagement_rate, s.signups, s.subscribes, s.estimated_value,
              s.sent, s.delivered, s.opens, s.opened, s.clicks, s.clicked, s.click_rate,
              s.likes, s.comments, s.shares, s.restacks, s.unsubscribes, s.finished_post,
              ${POST_RATIOS}
       FROM post_email_stats s
       JOIN latest l ON l.post_id = s.post_id AND l.run_id = s.run_id
       LEFT JOIN posts p ON p.post_id = s.post_id
       WHERE ${r.sql}
       ORDER BY ${col} DESC NULLS LAST
       LIMIT ?`,
    )
    .all(...(r.args as any[]), Math.min(Math.max(limit, 1), 500));
}

/**
 * Ficha completa de un post con su evolución entre syncs. Se busca por `post_id` exacto o por
 * `slug`; el id de Substack lleva el slug pegado (`206570960.mi-post`), así que un slug suelto
 * también casa por sufijo.
 */
export function getPost(db: Db, opts: { id?: string; slug?: string }) {
  const key = (opts.id ?? opts.slug ?? "").trim();
  if (!key) return null;
  const post = db
    .prepare(
      `SELECT * FROM posts
       WHERE post_id = ? OR slug = ? OR post_id LIKE '%.' || ?
       ORDER BY post_date DESC LIMIT 1`,
    )
    .get(key, key, key) as Record<string, unknown> | undefined;
  // Un post puede existir solo en las stats (el export de posts y el de email no siempre coinciden).
  const postId =
    (post?.post_id as string | undefined) ??
    (db.prepare("SELECT post_id FROM post_email_stats WHERE post_id = ? LIMIT 1").get(key) as { post_id: string } | undefined)?.post_id;
  if (!postId) return null;
  const latest = db
    .prepare(
      `SELECT s.*, ${POST_RATIOS}
       FROM post_email_stats s WHERE s.post_id = ? ORDER BY s.run_id DESC LIMIT 1`,
    )
    .get(postId) as Record<string, unknown> | undefined;
  const history = db
    .prepare(
      `SELECT s.run_id, r.started_at AS synced_at, s.views, s.open_rate, s.click_rate, s.signups, s.subscribes,
              s.sent, s.delivered, s.opened, s.clicked, s.likes, s.comments, s.shares, s.restacks, s.unsubscribes
       FROM post_email_stats s JOIN sync_runs r ON r.id = s.run_id
       WHERE s.post_id = ? ORDER BY s.run_id`,
    )
    .all(postId);
  return {
    post: post ? withExtra(post) : null,
    latest_stats: latest ? withExtra(latest) : null,
    runs: history.length,
    history,
  };
}

export function getGrowth(db: Db, from?: string, to?: string, groupBy: "day" | "week" | "month" | "source" = "month") {
  const r = dateRange("date", from, to);
  const args: unknown[] = r.args;
  const w = from || to ? `WHERE ${r.sql}` : "";
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

/**
 * Bajas y cambios de plan. `--from`/`--to` incluyen el día entero en los dos extremos: con el `<=`
 * anterior, `--to 2026-09-09` no devolvía las bajas del 9 porque sus marcas llevan hora.
 */
export function getChurn(db: Db, from?: string, to?: string) {
  const r = dateRange("unsubscribed_at", from, to);
  const w = `WHERE unsubscribed_at IS NOT NULL AND ${r.sql}`;
  const args: unknown[] = [...r.args];
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
       WHERE a.plan <> b.plan AND ${dateRange("r.started_at", from, to).sql}
       ORDER BY r.started_at DESC LIMIT 500`,
    )
    .all(...(dateRange("r.started_at", from, to).args as any[]));
  const paid = new Set<string>(PAID_PLANS);
  const summary = {
    churned: churned.length,
    // Solo cuenta como alta de pago la que entra en un plan que cobra: pasar a `author` o `comp`
    // no es una conversión.
    upgrades: transitions.filter((t: any) => t.from_plan === "free" && paid.has(t.to_plan)).length,
    downgrades: transitions.filter((t: any) => paid.has(t.from_plan) && t.to_plan === "free").length,
  };
  return { range: { from: from ?? null, to: to ?? null, both_ends_inclusive: true }, summary, churned, transitions };
}

/**
 * Quién se fue, juntando las dos fuentes que existen, porque miden cosas distintas y discrepan:
 *
 * - `unsubscribes` es la lista del panel de Substack, con la fecha real de cada baja. Solo recoge
 *   la baja voluntaria, la de quien pulsa el enlace.
 * - `subscribers.unsubscribed_at` sale de comparar la lista entre syncs, así que detecta a
 *   cualquiera que desaparezca, se haya ido como se haya ido: un rebote permanente, una marca de
 *   spam o un borrado a mano. A cambio, su fecha es la del sync que lo notó, no la de la baja.
 *
 * Devolver solo una de las dos deja fuera gente de verdad o inventa precisión que no hay. Esta
 * consulta enseña ambas y dice en qué se diferencian, para no tener que salir a buscarlo fuera.
 */
export function getUnsubscribes(db: Db, from?: string, to?: string, limit = 50) {
  const rSub = dateRange("unsubscribed_at", from, to);
  const deSubstack = db
    .prepare(
      `SELECT email, unsubscribed_at, subscribed_at, plan, source, name
         FROM unsubscribes WHERE ${rSub.sql} ORDER BY unsubscribed_at DESC LIMIT ?`,
    )
    .all(...(rSub.args as any[]), limit) as Record<string, unknown>[];

  const rDet = dateRange("unsubscribed_at", from, to);
  const detectadas = db
    .prepare(
      `SELECT email, plan, subscribed_at, unsubscribed_at AS detected_at
         FROM subscribers WHERE is_active = 0 AND unsubscribed_at IS NOT NULL AND ${rDet.sql}
        ORDER BY unsubscribed_at DESC LIMIT ?`,
    )
    .all(...(rDet.args as any[]), limit) as Record<string, unknown>[];

  const enSubstack = new Set(deSubstack.map((r) => String(r.email).toLowerCase()));
  const soloDetectadas = detectadas.filter((r) => !enSubstack.has(String(r.email).toLowerCase()));

  return {
    range: { from: from ?? null, to: to ?? null, both_ends_inclusive: true },
    summary: {
      baja_voluntaria: deSubstack.length,
      desaparecidos_sin_baja_registrada: soloDetectadas.length,
    },
    que_significa_cada_una: {
      baja_voluntaria: "lista del panel de Substack, con la fecha real en que se dieron de baja",
      desaparecidos_sin_baja_registrada:
        "dejaron de aparecer en la lista entre dos syncs y Substack no anotó una baja: suele ser rebote permanente, marca de spam o borrado manual. `detected_at` es cuándo se notó, no cuándo se fueron",
    },
    baja_voluntaria: deSubstack,
    desaparecidos_sin_baja_registrada: soloDetectadas,
  };
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

/**
 * Palabras que solo pueden ser sentencias, nunca funciones ni columnas. `replace` NO está: es una
 * función escalar legítima de SQLite (`replace(body, x, y)`), así que se veta solo `REPLACE INTO`.
 */
const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|attach|detach|pragma|vacuum|reindex|load_extension)\b|\breplace\s+into\b/i;

/** Vacía literales de texto e identificadores citados para que su contenido no dispare el filtro. */
function stripLiterals(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .replace(/`(?:[^`]|``)*`/g, "``")
    .replace(/\[[^\]]*\]/g, "[]");
}

export function querySql(db: Db, sql: string, maxRows = 200) {
  const trimmed = sql.trim().replace(/;+$/, "");
  // El filtro mira la consulta sin literales: buscar la palabra "update" en un texto es legítimo.
  const bare = stripLiterals(trimmed);
  if (!/^\s*(select|with)\b/i.test(bare)) throw new Error("Solo se permiten sentencias SELECT / WITH.");
  if (FORBIDDEN.test(bare)) throw new Error("La consulta contiene palabras clave de escritura; solo lectura.");
  if (bare.includes(";")) throw new Error("Una sola sentencia por consulta.");
  const hasLimit = /\blimit\b/i.test(bare);
  const rows = db.prepare(hasLimit ? trimmed : `${trimmed} LIMIT ${maxRows}`).all();
  return { row_count: rows.length, truncated_at: hasLimit ? null : maxRows, rows };
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

/** Notas propias con contadores y, si Substack ya las publicó, las stats (impresiones, etc.). */
export function getNotesPerformance(db: Db, sort: "date" | "reactions" | "restacks" | "replies" | "interactions" = "interactions", limit = 50) {
  const order = {
    date: "n.date DESC",
    reactions: "n.reaction_count DESC, n.date DESC",
    restacks: "n.restacks DESC, n.date DESC",
    replies: "n.replies_count DESC, n.date DESC",
    interactions: "(n.reaction_count + n.restacks + n.replies_count) DESC, n.date DESC",
  }[sort];
  return db
    .prepare(
      `SELECT n.note_id, n.date, substr(n.body, 1, 200) AS excerpt, n.reaction_count AS likes, n.restacks, n.replies_count AS replies,
              (n.reaction_count + n.restacks + n.replies_count) AS interactions,
              (SELECT COUNT(DISTINCT actor_user_id) FROM note_interactions i WHERE i.note_id = n.note_id) AS unique_people,
              n.attachments, n.stats IS NOT NULL AS has_stats,
              'https://substack.com/@' || COALESCE((SELECT handle FROM note_actors WHERE user_id = n.user_id), '') || '/note/c-' || n.note_id AS url
       FROM notes n ORDER BY ${order} LIMIT ?`,
    )
    .all(Math.min(Math.max(limit, 1), 500))
    .map((r: any) => ({ ...r, attachments: safeJson(r.attachments) }));
}

/**
 * Quién interactúa más con tus Notes: likes, restacks y respuestas por persona, con su publicación y
 * si Substack la marca como seguidora. `matched_subscriber_email` intenta casar por nombre con la lista
 * de suscriptores (Substack no da el email de quien da like), así que es una pista, no una certeza.
 */
export function getNoteEngagers(db: Db, limit = 30, kind?: "like" | "restack" | "reply") {
  const where = kind ? "WHERE i.kind = ?" : "";
  const args: unknown[] = kind ? [kind] : [];
  return db
    .prepare(
      `SELECT a.user_id, a.name, a.handle, a.publication_subdomain, a.publication_name, a.is_following, a.is_subscribed,
              COUNT(*) AS interactions,
              SUM(i.kind = 'like') AS likes, SUM(i.kind = 'restack') AS restacks, SUM(i.kind = 'reply') AS replies,
              COUNT(DISTINCT i.note_id) AS notes_touched,
              MIN(n.date) AS first_interaction_note_date, MAX(n.date) AS last_interaction_note_date,
              (SELECT s.email FROM subscribers s WHERE s.is_active = 1 AND a.name IS NOT NULL
                 AND lower(json_extract(s.extra, '$.name')) = lower(a.name) LIMIT 1) AS matched_subscriber_email
       FROM note_interactions i
       JOIN note_actors a ON a.user_id = i.actor_user_id
       JOIN notes n ON n.note_id = i.note_id
       ${where}
       GROUP BY a.user_id
       ORDER BY interactions DESC, replies DESC, restacks DESC, likes DESC
       LIMIT ?`,
    )
    .all(...(args as any[]), Math.min(Math.max(limit, 1), 500));
}

export function getNote(db: Db, noteId: number) {
  const note = db.prepare("SELECT * FROM notes WHERE note_id = ?").get(noteId) as Record<string, unknown> | undefined;
  if (!note) return null;
  const interactions = db
    .prepare(
      `SELECT i.kind, i.created_at, i.body, i.reaction_count, a.user_id, a.name, a.handle, a.publication_subdomain, a.is_following
       FROM note_interactions i JOIN note_actors a ON a.user_id = i.actor_user_id
       WHERE i.note_id = ? ORDER BY i.kind, i.created_at`,
    )
    .all(noteId);
  return { ...note, attachments: safeJson(note.attachments), stats: safeJson(note.stats), interactions };
}

function safeJson(v: unknown) {
  if (typeof v !== "string") return v ?? null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

/**
 * Contadores de las notas ya guardadas, para el sync incremental. Se lee de la BD y se compara
 * con lo que el feed devuelve gratis, así no hace falta pedir interacciones de lo que no cambió.
 */
export function knownNotes(db: Db): { counts: Map<number, { reaction_count: number; restacks: number; children_count: number }>; withStats: Set<number> } {
  const rows = db
    .prepare("SELECT note_id, reaction_count, restacks, replies_count, stats IS NOT NULL AS has_stats FROM notes")
    .all() as { note_id: number; reaction_count: number; restacks: number; replies_count: number; has_stats: number }[];
  const counts = new Map<number, { reaction_count: number; restacks: number; children_count: number }>();
  const withStats = new Set<number>();
  for (const r of rows) {
    counts.set(r.note_id, {
      reaction_count: r.reaction_count,
      restacks: r.restacks,
      // En la BD se llama replies_count; en el feed, children_count.
      children_count: r.replies_count,
    });
    if (r.has_stats) withStats.add(r.note_id);
  }
  return { counts, withStats };
}

/**
 * Qué datos hay, de dónde vinieron y si alguna vez se intentó traerlos.
 *
 * La distinción que importa: una tabla vacía puede significar «nunca se descargó» o «se descargó
 * y no había nada» — quien nunca ha escrito una nota tendrá `notes` a cero para siempre. Sin
 * separarlas, el skill lanzaría un sync en cada pregunta eternamente. `raw_files` registra qué
 * se ingirió en cada run, así que sirve de testigo.
 */
export interface Coverage {
  dataset: string;
  rows: number;
  /** Sync del que provienen las filas, cuando la tabla lo registra. */
  last_run_id: number | null;
  /** Si alguna vez se ingirió su fuente, aunque viniera vacía. */
  ever_fetched: boolean;
  /** Vacío Y nunca descargado: lo único que justifica lanzar un sync. */
  missing: boolean;
}

/** Tabla → nombre de cara al usuario, columna del run, y el `kind` de `raw_files` que la llena. */
const DATASETS: { dataset: string; table: string; runColumn?: string; source: string }[] = [
  { dataset: "subscribers", table: "subscribers", runColumn: "last_synced_run_id", source: "email_list" },
  // `posts` ya registra el run que la llenó; antes devolvía siempre last_run_id: null porque la
  // columna no existía, y `status` no podía decir de qué sync venían los posts.
  { dataset: "posts", table: "posts", runColumn: "last_synced_run_id", source: "posts" },
  { dataset: "post_stats", table: "post_email_stats", runColumn: "run_id", source: "email_stats" },
  { dataset: "growth", table: "growth_sources", runColumn: "run_id", source: "growth_sources" },
  { dataset: "traffic", table: "traffic", runColumn: "run_id", source: "traffic" },
  { dataset: "subscriber_totals", table: "subscriber_totals", runColumn: "run_id", source: "subscriber_totals" },
  { dataset: "subscriber_growth", table: "subscriber_growth_daily", runColumn: "run_id", source: "paid_subscriber_growth" },
  { dataset: "notes", table: "notes", runColumn: "last_synced_run_id", source: "notes" },
  // Las interacciones vienen dentro del mismo bundle que las notas.
  { dataset: "note_interactions", table: "note_interactions", runColumn: "run_id", source: "notes" },
  // Tablas del panel. Cada una tiene su propio `kind` en raw_files, así que `status` distingue
  // «nunca se descargó» de «se descargó y venía vacía» una por una.
  { dataset: "followers", table: "followers_daily", runColumn: "run_id", source: "followers" },
  { dataset: "unsubscribes", table: "unsubscribes", runColumn: "run_id", source: "unsubscribes" },
  { dataset: "visitor_sources", table: "visitor_sources", runColumn: "run_id", source: "visitor_sources" },
  { dataset: "network_attribution", table: "network_attribution", runColumn: "run_id", source: "network_attribution" },
  { dataset: "audience_location", table: "audience_location", runColumn: "run_id", source: "audience_location" },
  { dataset: "audience_overlap", table: "audience_overlap", runColumn: "run_id", source: "audience_overlap" },
  { dataset: "referrers", table: "referrers", runColumn: "run_id", source: "referrers" },
  { dataset: "pub_summary", table: "pub_summary", runColumn: "run_id", source: "pub_summary" },
];

export function coverage(db: Db): Coverage[] {
  const fetched = new Set(
    (db.prepare("SELECT DISTINCT kind FROM raw_files").all() as { kind: string }[]).map((r) => r.kind),
  );
  return DATASETS.map(({ dataset, table, runColumn, source }) => {
    const rows = (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
    let last_run_id: number | null = null;
    if (runColumn && rows > 0) {
      last_run_id = (db.prepare(`SELECT MAX(${runColumn}) AS r FROM ${table}`).get() as { r: number | null }).r ?? null;
    }
    const ever_fetched = fetched.has(source);
    return { dataset, rows, last_run_id, ever_fetched, missing: rows === 0 && !ever_fetched };
  });
}

/**
 * Conjuntos que nunca se han descargado. Una tabla vacía cuya fuente sí se ingirió NO sale aquí:
 * el usuario simplemente no tiene esos datos, y volver a pedirlos no cambiaría nada.
 */
export const missingDatasets = (db: Db): string[] => coverage(db).filter((c) => c.missing).map((c) => c.dataset);

/* ------------------------------------------------------------------------------------------- *
 * Segmentación de lectores y momento de envío
 * ------------------------------------------------------------------------------------------- */

/**
 * Base común de las consultas de engagement. Todo lo que sale de `extra` va casteado a entero:
 * Substack exporta «Unique emails seen (6mo)» como texto y compararlo con un INTEGER en SQLite
 * no falla, simplemente miente (todo INTEGER < todo TEXT).
 */
const READER_BASE = `
  WITH r AS (
    SELECT email, plan, source, subscribed_at,
           json_extract(extra, '$.name') AS name,
           json_extract(extra, '$.activity') AS activity,
           ${RECEIVED_6MO} AS emails_received_6mo,
           ${SEEN_6MO} AS unique_emails_seen_6mo,
           ${SEEN_30D} AS unique_emails_seen_30d,
           json_extract(extra, '$.links_clicked') AS links_clicked,
           json_extract(extra, '$.last_email_open') AS last_email_open
    FROM subscribers WHERE is_active = 1
  ),
  s AS (
    SELECT r.*,
           CASE WHEN emails_received_6mo > 0
                THEN 1.0 * COALESCE(unique_emails_seen_6mo, 0) / emails_received_6mo END AS open_ratio,
           CAST(julianday('now') - julianday(last_email_open) AS INTEGER) AS days_since_last_open,
           CASE
             -- Sin correos recibidos no hay nada que juzgar; no es «nunca abre».
             WHEN COALESCE(emails_received_6mo, 0) = 0 THEN 'sin-envios'
             WHEN COALESCE(unique_emails_seen_6mo, 0) = 0 THEN 'nunca-abre'
             WHEN emails_received_6mo >= 3
                  AND (last_email_open IS NULL OR julianday('now') - julianday(last_email_open) > 60)
                  THEN 'dormido'
             WHEN unique_emails_seen_6mo >= emails_received_6mo THEN 'abre-todo'
             ELSE 'regular'
           END AS segment
    FROM r
  )`;

export const READER_SEGMENTS = ["abre-todo", "regular", "dormido", "nunca-abre", "sin-envios"] as const;
export type ReaderSegment = (typeof READER_SEGMENTS)[number];

/** Suscriptores activos repartidos por cómo se comportan con el correo. */
export function getReaders(db: Db, segment?: string, limit = 50) {
  const counts = db.prepare(`${READER_BASE} SELECT segment, COUNT(*) AS n FROM s GROUP BY segment`).all() as {
    segment: string;
    n: number;
  }[];
  const where = segment ? "WHERE segment = ?" : "";
  const rows = db
    .prepare(
      `${READER_BASE}
       SELECT email, name, plan, source, segment, activity, emails_received_6mo, unique_emails_seen_6mo,
              unique_emails_seen_30d, ROUND(open_ratio, 3) AS open_ratio, links_clicked,
              last_email_open, days_since_last_open, subscribed_at
       FROM s ${where}
       ORDER BY open_ratio DESC NULLS LAST, emails_received_6mo DESC, subscribed_at ASC
       LIMIT ?`,
    )
    .all(...((segment ? [segment] : []) as any[]), Math.min(Math.max(limit, 1), 500));
  return {
    criteria: {
      "abre-todo": "aperturas únicas >= correos recibidos (6 meses)",
      regular: "abre algunos, pero no todos",
      dormido: "recibió >= 3 correos y no abre ninguno desde hace más de 60 días",
      "nunca-abre": "recibió correos y no ha abierto ninguno",
      "sin-envios": "todavía no ha recibido ningún correo: no se puede juzgar",
    },
    counts_by_segment: Object.fromEntries(counts.map((c) => [c.segment, c.n])),
    segment: segment ?? null,
    count: rows.length,
    rows,
  };
}

/**
 * Activos que ya recibieron lo bastante para haber abierto algo y no lo hacen. Los de pago van
 * primero porque una baja suya cuesta dinero, no solo una dirección.
 */
export function getAtRisk(db: Db, days = 60, limit = 50) {
  const d = Math.min(Math.max(days, 1), 3650);
  const rows = db
    .prepare(
      `${READER_BASE}
       SELECT email, name, plan, source, segment, activity, emails_received_6mo, unique_emails_seen_6mo,
              ROUND(open_ratio, 3) AS open_ratio, last_email_open, days_since_last_open, subscribed_at,
              CASE WHEN ${PAID_SQL} THEN 1 ELSE 0 END AS is_paid
       FROM s
       WHERE emails_received_6mo >= 3
         AND (last_email_open IS NULL OR julianday('now') - julianday(last_email_open) > ?)
       ORDER BY is_paid DESC, emails_received_6mo DESC, days_since_last_open DESC NULLS FIRST
       LIMIT ?`,
    )
    .all(d, Math.min(Math.max(limit, 1), 500));
  return {
    criteria: `activos con >= 3 correos recibidos (6 meses) y sin abrir ninguno desde hace más de ${d} días`,
    days: d,
    count: rows.length,
    rows,
  };
}

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Cuándo funcionan mejor los envíos. La base guarda las horas en UTC, así que `--tz` las desplaza
 * al huso del usuario antes de agrupar. Cada celda lleva su número de posts: con una o dos
 * muestras la media no dice nada, y sin ese contador cualquiera la leería como una conclusión.
 *
 * La hora sale de `email_sent_at` cuando existe y si no de `post_date`. El endpoint del que salen
 * los posts (`/api/v1/archive`) no devuelve `email_sent_at`, así que en la práctica manda
 * `post_date`, que lleva la hora real de publicación —verificada contra el panel—. `coverage`
 * dice cuántos posts vinieron de cada campo para que se sepa qué se está midiendo.
 */
export function getBestTime(db: Db, tzOffsetHours = 0, minPosts = 1) {
  const tz = Math.min(Math.max(Math.trunc(tzOffsetHours), -14), 14);
  const modifier = `${tz >= 0 ? "+" : ""}${tz} hours`;
  const base = `
    WITH latest AS (SELECT post_id, MAX(run_id) AS run_id FROM post_email_stats GROUP BY post_id),
    e AS (
      SELECT s.post_id, s.open_rate, s.click_rate,
             datetime(COALESCE(p.email_sent_at, p.post_date), ?) AS sent_local
      FROM post_email_stats s
      JOIN latest l ON l.post_id = s.post_id AND l.run_id = s.run_id
      JOIN posts p ON p.post_id = s.post_id
      WHERE COALESCE(p.email_sent_at, p.post_date) IS NOT NULL
    )`;
  const byWeekday = db
    .prepare(
      `${base}
       SELECT CAST(strftime('%w', sent_local) AS INTEGER) AS weekday, COUNT(*) AS posts,
              AVG(open_rate) AS avg_open_rate, AVG(click_rate) AS avg_click_rate
       FROM e GROUP BY weekday HAVING posts >= ? ORDER BY weekday`,
    )
    .all(modifier, minPosts) as { weekday: number }[];
  const byHour = db
    .prepare(
      `${base}
       SELECT CAST(strftime('%H', sent_local) AS INTEGER) AS hour, COUNT(*) AS posts,
              AVG(open_rate) AS avg_open_rate, AVG(click_rate) AS avg_click_rate
       FROM e GROUP BY hour HAVING posts >= ? ORDER BY hour`,
    )
    .all(modifier, minPosts);
  const cells = db
    .prepare(
      `${base}
       SELECT CAST(strftime('%w', sent_local) AS INTEGER) AS weekday,
              CAST(strftime('%H', sent_local) AS INTEGER) AS hour, COUNT(*) AS posts,
              AVG(open_rate) AS avg_open_rate
       FROM e GROUP BY weekday, hour HAVING posts >= ? ORDER BY avg_open_rate DESC NULLS LAST`,
    )
    .all(modifier, minPosts) as { weekday: number }[];
  const cov = db
    .prepare(
      `WITH latest AS (SELECT post_id, MAX(run_id) AS run_id FROM post_email_stats GROUP BY post_id)
       SELECT COUNT(*) AS posts_with_stats,
              SUM(CASE WHEN COALESCE(p.email_sent_at, p.post_date) IS NOT NULL THEN 1 ELSE 0 END) AS posts_with_time,
              SUM(CASE WHEN p.email_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS time_from_email_sent_at,
              SUM(CASE WHEN p.email_sent_at IS NULL AND p.post_date IS NOT NULL THEN 1 ELSE 0 END) AS time_from_post_date,
              COUNT(s.open_rate) AS posts_with_open_rate
       FROM post_email_stats s
       JOIN latest l ON l.post_id = s.post_id AND l.run_id = s.run_id
       LEFT JOIN posts p ON p.post_id = s.post_id`,
    )
    .get() as { posts_with_time: number; time_from_post_date: number; time_from_email_sent_at: number };
  const named = <T extends { weekday: number }>(rows: T[]) => rows.map((r) => ({ ...r, weekday_name: WEEKDAYS[r.weekday] }));
  return {
    tz_offset_hours: tz,
    coverage: cov,
    // Sin ninguna hora no hay nada que agrupar: se dice, en vez de devolver tablas vacías a secas.
    note:
      cov.posts_with_time === 0
        ? "ningún post tiene hora (`email_sent_at` ni `post_date`): no hay nada que analizar"
        : cov.time_from_email_sent_at === 0
          ? "la hora sale de `post_date` (el archivo de Substack no devuelve `email_sent_at`); mira `posts` en cada celda antes de concluir"
          : "medias sobre la hora de envío; mira `posts` en cada celda antes de concluir",
    by_weekday: named(byWeekday),
    by_hour: byHour,
    by_weekday_hour: named(cells),
  };
}

/* ------------------------------------------------------------------------------------------- *
 * Fuentes, series y tablas del panel
 * ------------------------------------------------------------------------------------------- */

/**
 * Calidad por fuente de captación: no cuántos trae, sino cuántos se quedan y leen. Las tres
 * tablas del panel (visitas por fuente, atribución de red y bajas con fuente) se devuelven al
 * lado, sin mezclarlas: miden universos distintos y sumarlas daría un número inventado.
 */
export function getSources(db: Db, limit = 50) {
  const lim = Math.min(Math.max(limit, 1), 500);
  const bySource = db
    .prepare(
      `SELECT COALESCE(source, '(sin fuente)') AS source,
              COUNT(*) AS total,
              SUM(is_active) AS active,
              SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS unsubscribed,
              SUM(CASE WHEN is_active = 1 AND ${PAID_SQL} THEN 1 ELSE 0 END) AS active_paid,
              AVG(json_extract(extra, '$.activity')) AS avg_activity,
              CASE WHEN SUM(CASE WHEN ${RECEIVED_6MO} > 0 THEN ${RECEIVED_6MO} END) > 0
                   THEN 1.0 * SUM(CASE WHEN ${RECEIVED_6MO} > 0 THEN COALESCE(${SEEN_6MO}, 0) END)
                          / SUM(CASE WHEN ${RECEIVED_6MO} > 0 THEN ${RECEIVED_6MO} END) END AS open_rate,
              COUNT(${RECEIVED_6MO}) AS with_email_data
       FROM subscribers GROUP BY COALESCE(source, '(sin fuente)')
       ORDER BY active DESC, total DESC LIMIT ?`,
    )
    .all(lim);
  const unsubsBySource = db
    .prepare(
      `SELECT COALESCE(source, '(sin fuente)') AS source, COUNT(*) AS unsubscribes,
              MIN(unsubscribed_at) AS first_unsubscribe, MAX(unsubscribed_at) AS last_unsubscribe
       FROM unsubscribes GROUP BY COALESCE(source, '(sin fuente)') ORDER BY unsubscribes DESC LIMIT ?`,
    )
    .all(lim);
  const visitors = db
    .prepare(
      `SELECT source, category, views, users, free_signups, subscribed,
              CASE WHEN users > 0 THEN 1.0 * free_signups / users END AS signup_rate
       FROM visitor_sources ORDER BY free_signups DESC, views DESC LIMIT ?`,
    )
    .all(lim);
  const network = db
    .prepare(
      "SELECT label, time_window, subscribers, pct_of_total FROM network_attribution ORDER BY time_window, subscribers DESC",
    )
    .all();
  return {
    by_subscriber_source: bySource,
    unsubscribes_by_source: unsubsBySource,
    visitor_sources: visitors,
    network_attribution: network,
    note: "`by_subscriber_source` cuenta personas de la lista; `visitor_sources` cuenta visitas del panel. Son universos distintos y no deben sumarse.",
  };
}

/**
 * Serie diaria unificada: total de suscriptores, seguidores, visitas, altas free y bajas en una
 * sola tabla. Totales y seguidores son niveles (se toma el último valor del tramo, no la suma);
 * visitas, altas y bajas son flujos (se suman). Confundirlos daría totales absurdos al agrupar.
 */
export function getSeries(db: Db, from?: string, to?: string, groupBy: "day" | "week" | "month" = "day") {
  const bucketOf = (col: string) =>
    ({ day: col, week: `strftime('%Y-W%W', ${col})`, month: `substr(${col}, 1, 7)` })[groupBy];
  const args: unknown[] = [];
  // Cada bloque de rango aporta sus propios `?`, así que los argumentos se empujan en el mismo
  // orden en que aparecen en el SQL.
  const rng = (col: string) => {
    const r = dateRange(col, from, to);
    args.push(...r.args);
    return r.sql;
  };
  const sql = `
    WITH d AS (
      SELECT date FROM subscriber_totals WHERE ${rng("date")}
      UNION SELECT date FROM followers_daily WHERE ${rng("date")}
      UNION SELECT date FROM traffic WHERE ${rng("date")}
      UNION SELECT date FROM subscriber_growth_daily WHERE ${rng("date")}
    ),
    b AS (SELECT DISTINCT ${bucketOf("date")} AS bucket FROM d)
    SELECT b.bucket,
           (SELECT MIN(date) FROM d WHERE ${bucketOf("d.date")} = b.bucket) AS from_date,
           (SELECT MAX(date) FROM d WHERE ${bucketOf("d.date")} = b.bucket) AS to_date,
           (SELECT t.total_subscribers FROM subscriber_totals t
             WHERE ${bucketOf("t.date")} = b.bucket AND ${rng("t.date")}
             ORDER BY t.date DESC LIMIT 1) AS total_subscribers_end,
           (SELECT f.followers FROM followers_daily f
             WHERE ${bucketOf("f.date")} = b.bucket AND ${rng("f.date")}
             ORDER BY f.date DESC LIMIT 1) AS followers_end,
           (SELECT SUM(x.views) FROM traffic x
             WHERE ${bucketOf("x.date")} = b.bucket AND ${rng("x.date")}) AS views,
           (SELECT SUM(g.new_free) FROM subscriber_growth_daily g
             WHERE ${bucketOf("g.date")} = b.bucket AND ${rng("g.date")}) AS new_free,
           (SELECT SUM(g.unsubscribes) FROM subscriber_growth_daily g
             WHERE ${bucketOf("g.date")} = b.bucket AND ${rng("g.date")}) AS unsubscribes,
           (SELECT SUM(g.new_paid) FROM subscriber_growth_daily g
             WHERE ${bucketOf("g.date")} = b.bucket AND ${rng("g.date")}) AS new_paid
    FROM b ORDER BY b.bucket`;
  const rows = db.prepare(sql).all(...(args as any[]));
  const sources = Object.fromEntries(
    (["subscriber_totals", "followers_daily", "traffic", "subscriber_growth_daily"] as const).map((t) => [
      t,
      (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n,
    ]),
  );
  return {
    group_by: groupBy,
    range: { from: from ?? null, to: to ?? null, both_ends_inclusive: true },
    rows_in_source_tables: sources,
    note: "`*_end` es el nivel al cierre del tramo; `views`, `new_free`, `unsubscribes` y `new_paid` son sumas. null = no hay serie para ese tramo.",
    count: rows.length,
    rows,
  };
}

/**
 * Quién te trae lectores, tal cual lo lista el panel. Sin tasa de conversión a propósito: el panel
 * cuenta las visitas de una ventana corta y los suscriptores de toda la vida del referidor, así que
 * dividir uno por otro da cosas como «700 %». Los dos números se devuelven crudos.
 */
export function getReferrers(db: Db, limit = 50) {
  const rows = db
    .prepare(
      `SELECT user_id, name, handle, visitors, free_subscribers, paid_subscribers,
              (free_subscribers + paid_subscribers) AS subscribers,
              'https://substack.com/@' || COALESCE(handle, '') AS url
       FROM referrers ORDER BY subscribers DESC, visitors DESC LIMIT ?`,
    )
    .all(Math.min(Math.max(limit, 1), 500));
  const last = (db.prepare("SELECT MAX(run_id) AS r FROM referrers").get() as { r: number | null }).r ?? null;
  return {
    last_run_id: last,
    note: "`visitors` y `*_subscribers` los da el panel sobre ventanas distintas; no son un embudo y no deben dividirse.",
    count: rows.length,
    rows,
  };
}

/** Publicaciones que comparten audiencia contigo: a quién pedir (o dar) una recomendación. */
export function getOverlap(db: Db, limit = 50, minPercent = 0) {
  const rows = db
    .prepare(
      `SELECT subdomain, name, author, percent_overlap,
              'https://' || subdomain || '.substack.com' AS url
       FROM audience_overlap WHERE percent_overlap >= ? ORDER BY percent_overlap DESC LIMIT ?`,
    )
    .all(minPercent, Math.min(Math.max(limit, 1), 500));
  const last = (db.prepare("SELECT MAX(run_id) AS r FROM audience_overlap").get() as { r: number | null }).r ?? null;
  return { last_run_id: last, min_percent: minPercent, count: rows.length, rows };
}
