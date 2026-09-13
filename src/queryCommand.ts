import type { Db } from "./db/index.js";
import * as q from "./queries.js";

/**
 * Despacho de `stackchat q <nombre> [--flag valor]`. Es la cara de línea de comandos de las mismas
 * funciones que expone el servidor MCP: una sola implementación, dos formas de invocarla.
 */

export interface QueryDef {
  /** Qué devuelve, en una línea: se imprime en la ayuda y en el error de nombre desconocido. */
  summary: string;
  flags?: string;
  run: (db: Db, f: Flags) => unknown;
}

export type Flags = Record<string, string | boolean>;

export class UsageError extends Error {}

const str = (f: Flags, name: string): string | undefined => {
  const v = f[name];
  if (v === undefined) return undefined;
  if (typeof v === "boolean") throw new UsageError(`--${name} necesita un valor`);
  return v;
};

const int = (f: Flags, name: string, fallback: number): number => {
  const v = str(f, name);
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new UsageError(`--${name} debe ser un entero, no ${JSON.stringify(v)}`);
  return n;
};

/** Como `int`, pero admite decimales: `percent_overlap` viene como 0.37, no como 37. */
const num = (f: Flags, name: string, fallback: number): number => {
  const v = str(f, name);
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new UsageError(`--${name} debe ser un número, no ${JSON.stringify(v)}`);
  return n;
};

const bool = (f: Flags, name: string): boolean | undefined => {
  const v = f[name];
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (/^(true|1|si|sí|yes)$/i.test(v)) return true;
  if (/^(false|0|no)$/i.test(v)) return false;
  throw new UsageError(`--${name} debe ser true o false`);
};

/** Valida contra una lista cerrada para que un typo no pase silenciosamente al SQL. */
const enumFlag = <T extends string>(f: Flags, name: string, allowed: readonly T[], fallback: T): T => {
  const v = str(f, name);
  if (v === undefined) return fallback;
  if (!(allowed as readonly string[]).includes(v)) {
    throw new UsageError(`--${name} debe ser uno de: ${allowed.join(", ")}`);
  }
  return v as T;
};

/**
 * Fechas: solo ISO `YYYY-MM-DD`. Se comparan como texto contra las fechas ISO de la base, así que
 * cualquier otro formato filtra de más o de menos SIN dar error. `--after 10-09-2026` devolvía los
 * 132 suscriptores en vez de los 4 reales, y la respuesta parecía perfectamente razonable.
 */
const dateFlag = (f: Flags, name: string): string | undefined => {
  const v = str(f, name);
  if (v === undefined) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m && new Date(`${v}T00:00:00Z`);
  if (!m || !d || Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3])) {
    throw new UsageError(`--${name} debe ser una fecha YYYY-MM-DD, no ${JSON.stringify(v)}`);
  }
  return v;
};

const POST_SORTS = Object.keys(q.POST_SORT_COLUMNS) as [string, ...string[]];
/**
 * `paid` son solo los planes que cobran; `other` es el resto de no-free (author, comp, gift), que
 * antes se contaba como pago e inflaba la cifra de ingresos con el propio autor.
 */
const PLANS = ["free", "paid", "other", "monthly", "yearly", "founding", "author", "comp", "gift"] as const;
const NOTE_SORTS = ["date", "reactions", "restacks", "replies", "interactions"] as const;
const GROUPS = ["day", "week", "month", "source"] as const;
const SERIES_GROUPS = ["day", "week", "month"] as const;
const KINDS = ["like", "restack", "reply"] as const;

/** Nota de ayuda repetida: las dos puntas del rango incluyen el día entero, con hora o sin ella. */
const RANGE_HELP = "(--from y --to incluyen el día entero en ambos extremos)";

export const QUERIES: Record<string, QueryDef> = {
  overview: {
    summary:
      "Totales (free / paid real / other), reparto por plan, altas 30/90d por tres orígenes distintos y último sync. Empieza por aquí.",
    run: (db) => q.getOverview(db),
  },
  subscribers: {
    summary: "Lista contactos con filtros. `paid` = planes que cobran; `other` = author/comp/gift.",
    flags: `--plan ${PLANS.join("|")} --active true|false --after YYYY-MM-DD --before YYYY-MM-DD --email texto --limit N --offset N ${RANGE_HELP.replace("--from y --to", "--after y --before")}`,
    run: (db, f) =>
      q.listSubscribers(db, {
        plan: f.plan === undefined ? undefined : enumFlag(f, "plan", PLANS, "free"),
        is_active: bool(f, "active"),
        subscribed_after: dateFlag(f, "after"),
        subscribed_before: dateFlag(f, "before"),
        email_contains: str(f, "email"),
        limit: int(f, "limit", 50),
        offset: int(f, "offset", 0),
      }),
  },
  subscriber: {
    summary: "Ficha de un contacto por email, con su historial de plan en cada sync.",
    flags: "--email alguien@ejemplo.com",
    run: (db, f) => {
      const email = str(f, "email");
      if (!email) throw new UsageError("subscriber necesita --email");
      return q.getSubscriber(db, email) ?? { error: "No existe ese email en la base." };
    },
  },
  candidates: {
    summary:
      "Free activos puntuados como candidatos a pago con las señales que la base tiene (activity, aperturas únicas, clics, comentarios, shares, penalización por apertura antigua). `method` dice cuáles se usaron.",
    flags: "--limit N --min-days N",
    run: (db, f) => q.findUpgradeCandidates(db, int(f, "limit", 50), int(f, "min-days", 14)),
  },
  posts: {
    summary: "Posts con views, open_rate, envíos, clics, likes, comentarios, bajas y ratios por mil visitas.",
    flags: `--sort ${POST_SORTS.join("|")} --limit N --from YYYY-MM-DD --to YYYY-MM-DD ${RANGE_HELP}`,
    run: (db, f) =>
      q.getPostPerformance(db, enumFlag(f, "sort", POST_SORTS, "post_date"), int(f, "limit", 50), dateFlag(f, "from"), dateFlag(f, "to")),
  },
  post: {
    summary: "Ficha de un post con todas sus métricas y cómo han cambiado entre syncs.",
    flags: "--id <post_id> | --slug <slug>",
    run: (db, f) => {
      const id = str(f, "id");
      const slug = str(f, "slug");
      if (!id && !slug) throw new UsageError("post necesita --id o --slug");
      return q.getPost(db, { id, slug }) ?? { error: "No hay ningún post con ese id o slug en la base." };
    },
  },
  growth: {
    summary: "Altas por fuente y series diarias free/paid, agrupadas.",
    flags: `--from YYYY-MM-DD --to YYYY-MM-DD --group-by ${GROUPS.join("|")} ${RANGE_HELP}`,
    run: (db, f) => q.getGrowth(db, dateFlag(f, "from"), dateFlag(f, "to"), enumFlag(f, "group-by", GROUPS, "month")),
  },
  series: {
    summary: "Serie unificada: total de suscriptores, seguidores, visitas, altas free y bajas en una tabla.",
    flags: `--from YYYY-MM-DD --to YYYY-MM-DD --group-by ${SERIES_GROUPS.join("|")} ${RANGE_HELP}`,
    run: (db, f) => q.getSeries(db, dateFlag(f, "from"), dateFlag(f, "to"), enumFlag(f, "group-by", SERIES_GROUPS, "day")),
  },
  unsubscribes: {
    summary: "Quién se dio de baja, con nombre y fecha, juntando la lista de Substack y los que desaparecieron entre syncs.",
    flags: `--from YYYY-MM-DD --to YYYY-MM-DD --limit N ${RANGE_HELP}`,
    run: (db, f) => q.getUnsubscribes(db, dateFlag(f, "from"), dateFlag(f, "to"), int(f, "limit", 50)),
  },
  churn: {
    summary: "Bajas y transiciones de plan entre syncs (necesita ≥2 syncs). Para solo las bajas, `unsubscribes` es más directa.",
    flags: `--from YYYY-MM-DD --to YYYY-MM-DD ${RANGE_HELP}`,
    run: (db, f) => q.getChurn(db, dateFlag(f, "from"), dateFlag(f, "to")),
  },
  readers: {
    summary: "Activos segmentados por engagement: abre-todo, regular, dormido, nunca-abre, sin-envios.",
    flags: `--segment ${q.READER_SEGMENTS.join("|")} --limit N`,
    run: (db, f) =>
      q.getReaders(db, f.segment === undefined ? undefined : enumFlag(f, "segment", q.READER_SEGMENTS, "regular"), int(f, "limit", 50)),
  },
  "at-risk": {
    summary: "Activos con ≥3 correos recibidos y sin abrir ninguno desde hace tiempo; los de pago primero.",
    flags: "--days N (60 por defecto) --limit N",
    run: (db, f) => q.getAtRisk(db, int(f, "days", 60), int(f, "limit", 50)),
  },
  "best-time": {
    summary: "Apertura media y número de posts por día de la semana y por hora (de `email_sent_at`, o de `post_date` si falta).",
    flags: "--tz -4 (desplazamiento en horas sobre UTC) --min-posts N",
    run: (db, f) => q.getBestTime(db, int(f, "tz", 0), int(f, "min-posts", 1)),
  },
  sources: {
    summary: "Calidad por fuente de captación: activos, activity media, apertura y bajas; más las tablas del panel.",
    flags: "--limit N",
    run: (db, f) => q.getSources(db, int(f, "limit", 50)),
  },
  referrers: {
    summary: "Quién te trae lectores: visitantes y suscriptores por referidor.",
    flags: "--limit N",
    run: (db, f) => q.getReferrers(db, int(f, "limit", 50)),
  },
  overlap: {
    summary: "Publicaciones con audiencia solapada, candidatas a recomendación cruzada.",
    flags: "--limit N --min-percent 0.2 (fracción 0-1, no porcentaje)",
    run: (db, f) => q.getOverlap(db, int(f, "limit", 50), num(f, "min-percent", 0)),
  },
  notes: {
    summary: "Tus Notes con likes, restacks, respuestas y personas únicas.",
    flags: `--sort ${NOTE_SORTS.join("|")} --limit N`,
    run: (db, f) => q.getNotesPerformance(db, enumFlag(f, "sort", NOTE_SORTS, "interactions"), int(f, "limit", 50)),
  },
  "note-engagers": {
    summary: "Quién interactúa más con tus Notes (likes + restacks + respuestas).",
    flags: `--limit N --kind ${KINDS.join("|")}`,
    run: (db, f) => q.getNoteEngagers(db, int(f, "limit", 30), f.kind === undefined ? undefined : enumFlag(f, "kind", KINDS, "like")),
  },
  note: {
    summary: "Una Note con su texto, stats y cada like/restack/respuesta con la persona.",
    flags: "--id 332284631",
    run: (db, f) => {
      const id = int(f, "id", NaN);
      if (!Number.isInteger(id)) throw new UsageError("note necesita --id <número>");
      return q.getNote(db, id) ?? { error: "No existe esa nota en la base." };
    },
  },
  schema: {
    summary: "Tablas, DDL y número de filas. Útil antes de escribir SQL a mano.",
    run: (db) => q.getSchema(db),
  },
};

export const QUERY_NAMES = Object.keys(QUERIES);

export function runQuery(db: Db, name: string, flags: Flags): unknown {
  const def = QUERIES[name];
  if (!def) {
    throw new UsageError(`Consulta desconocida: ${name}\n\nDisponibles:\n${helpText()}`);
  }
  return def.run(db, flags);
}

export function helpText(): string {
  return QUERY_NAMES.map((n) => {
    const d = QUERIES[n];
    return `  ${n.padEnd(15)} ${d.summary}${d.flags ? `\n  ${" ".repeat(15)} ${d.flags}` : ""}`;
  }).join("\n");
}

/** `--flag valor` y `--flag` (booleano). Se para en el primer token que no sea una opción. */
export function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith("--")) throw new UsageError(`Argumento inesperado: ${tok} (se esperaba --flag)`);
    const eq = tok.indexOf("=");
    if (eq !== -1) {
      flags[tok.slice(2, eq)] = tok.slice(eq + 1);
      continue;
    }
    const name = tok.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags[name] = next;
      i++;
    } else flags[name] = true;
  }
  return flags;
}
