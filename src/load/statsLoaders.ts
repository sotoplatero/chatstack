import type { Db } from "../db/index.js";
import { normDate, toInt, toNum, type Row } from "./csv.js";
import type { LoadResult } from "./loaders.js";

/**
 * Cargadores de las tablas de estadísticas que no son ni suscriptores ni posts: series de
 * seguidores y bajas, fuentes de visita, atribución de red, países, solapamiento de audiencia,
 * quién refiere lectores y las cifras sueltas del panel.
 *
 * Todas comparten la misma forma —reemplazar por clave dentro de una transacción— así que en vez
 * de repetir nueve funciones casi idénticas hay una tabla de definiciones y un cargador genérico.
 */

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

/** Acceso a columnas insensible a mayúsculas, espacios y guiones bajos. */
function col(row: Row, name: string): string | undefined {
  const want = name.toLowerCase().replace(/[\s_]+/g, "");
  for (const [k, v] of Object.entries(row)) if (k.toLowerCase().replace(/[\s_]+/g, "") === want) return v;
  return undefined;
}

type Conv = "text" | "int" | "num" | "date";

interface TableDef {
  table: string;
  /** Columna destino ← nombre (o nombres alternativos) en el CSV, y cómo convertirlo. */
  columns: [string, string | string[], Conv][];
  /** Columnas que no pueden faltar; si alguna viene vacía la fila se descarta. */
  required: string[];
  /** Se vacía antes de cargar: la fuente es una foto del total, no un incremento. */
  replaceAll?: boolean;
}

const DEFS: Record<string, TableDef> = {
  followers: {
    table: "followers_daily",
    columns: [["date", "date", "date"], ["followers", "followers", "int"]],
    required: ["date"],
  },
  unsubscribes: {
    table: "unsubscribes",
    columns: [
      ["email", "email", "text"],
      ["unsubscribed_at", "unsubscribed_at", "date"],
      ["subscribed_at", "subscribed_at", "date"],
      ["plan", "plan", "text"],
      ["source", "source", "text"],
      ["name", "name", "text"],
    ],
    required: ["email"],
  },
  visitor_sources: {
    table: "visitor_sources",
    columns: [
      ["source", "source", "text"],
      ["category", ["category", "source_category"], "text"],
      ["views", "views", "int"],
      ["users", "users", "int"],
      ["free_signups", ["free_signups", "free_signup"], "int"],
      ["subscribed", "subscribed", "int"],
    ],
    required: ["source"],
    replaceAll: true,
  },
  network_attribution: {
    table: "network_attribution",
    columns: [
      ["label", "label", "text"],
      ["time_window", "time_window", "text"],
      ["subscribers", ["subscribers", "subs_count"], "int"],
      ["pct_of_total", ["pct_of_total", "pct_time_window_total"], "num"],
    ],
    required: ["label"],
    replaceAll: true,
  },
  audience_location: {
    table: "audience_location",
    columns: [["location", "location", "text"], ["metric", "metric", "text"], ["value", "value", "int"]],
    required: ["location"],
    replaceAll: true,
  },
  audience_overlap: {
    table: "audience_overlap",
    columns: [
      ["subdomain", "subdomain", "text"],
      ["name", "name", "text"],
      ["author", "author", "text"],
      ["percent_overlap", "percent_overlap", "num"],
    ],
    required: ["subdomain"],
    replaceAll: true,
  },
  referrers: {
    table: "referrers",
    columns: [
      ["user_id", "user_id", "text"],
      ["name", "name", "text"],
      ["handle", "handle", "text"],
      ["visitors", "visitors", "int"],
      ["free_subscribers", "free_subscribers", "int"],
      ["paid_subscribers", "paid_subscribers", "int"],
    ],
    required: ["user_id"],
    replaceAll: true,
  },
  pub_summary: {
    table: "pub_summary",
    columns: [["metric", "metric", "text"], ["value", "value", "text"]],
    required: ["metric"],
  },
};

export type StatsKind = keyof typeof DEFS;

export function isStatsKind(kind: string): kind is StatsKind {
  return kind in DEFS;
}

function convert(raw: string | undefined, how: Conv): string | number | null {
  switch (how) {
    case "int":
      return toInt(raw);
    case "num":
      return toNum(raw);
    case "date":
      return normDate(raw);
    default: {
      const s = (raw ?? "").trim();
      return s === "" ? null : s;
    }
  }
}

export function loadStatsTable(db: Db, runId: number, kind: StatsKind, rows: Row[]): LoadResult {
  const def = DEFS[kind];
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const names = def.columns.map(([name]) => name);
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO ${def.table} (${names.join(", ")}, run_id) VALUES (${names.map(() => "?").join(", ")}, ?)`,
  );
  return tx(db, () => {
    if (def.replaceAll) db.exec(`DELETE FROM ${def.table}`);
    for (const row of rows) {
      const values = def.columns.map(([, from, how]) => {
        const candidates = Array.isArray(from) ? from : [from];
        for (const c of candidates) {
          const v = col(row, c);
          if (v !== undefined && v.trim() !== "") return convert(v, how);
        }
        return convert(undefined, how);
      });
      const missing = def.required.some((name) => {
        const v = values[names.indexOf(name)];
        return v === null || v === "";
      });
      if (missing) {
        res.skipped++;
        continue;
      }
      stmt.run(...(values as (string | number | null)[]), runId);
      res.inserted++;
    }
    return res;
  });
}

/**
 * Bajas por día. Substack las da en su propia serie, pero si esa petición falla se pueden
 * reconstruir desde la lista de bajas, que trae la fecha de cada una.
 */
export function loadUnsubscribesDaily(db: Db, runId: number, rows: Row[]): LoadResult {
  const res: LoadResult = { inserted: 0, updated: 0, skipped: 0 };
  const stmt = db.prepare(`INSERT INTO subscriber_growth_daily (date, unsubscribes, run_id) VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET unsubscribes = excluded.unsubscribes, run_id = excluded.run_id`);
  return tx(db, () => {
    for (const row of rows) {
      const date = normDate(col(row, "date"));
      if (!date) {
        res.skipped++;
        continue;
      }
      stmt.run(date, toInt(col(row, "unsubscribes")) ?? 0, runId);
      res.inserted++;
    }
    return res;
  });
}

/**
 * Altas free por día. Substack no expone esa serie —el endpoint de crecimiento solo cubre el
 * pago— así que se deriva de la fecha de alta de cada suscriptor free, que sí está en la base.
 * Se recalcula entera en cada carga: es una sola consulta y evita que queden días a medias.
 */
export function deriveFreeGrowth(db: Db, runId: number): number {
  const rows = db
    .prepare(
      `SELECT substr(subscribed_at, 1, 10) AS date, COUNT(*) AS n
         FROM subscribers
        WHERE subscribed_at IS NOT NULL AND plan = 'free'
        GROUP BY date`,
    )
    .all() as { date: string; n: number }[];
  const stmt = db.prepare(`INSERT INTO subscriber_growth_daily (date, new_free, run_id) VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET new_free = excluded.new_free, run_id = excluded.run_id`);
  return tx(db, () => {
    for (const r of rows) if (r.date) stmt.run(r.date, r.n, runId);
    return rows.length;
  });
}
