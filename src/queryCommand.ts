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

const POST_SORTS = ["open_rate", "views", "subscribes", "signups", "post_date"] as const;
const NOTE_SORTS = ["date", "reactions", "restacks", "replies", "interactions"] as const;
const GROUPS = ["day", "week", "month", "source"] as const;
const KINDS = ["like", "restack", "reply"] as const;

export const QUERIES: Record<string, QueryDef> = {
  overview: {
    summary: "Totales de suscriptores, reparto por plan, altas 30/90d y último sync. Empieza por aquí.",
    run: (db) => q.getOverview(db),
  },
  subscribers: {
    summary: "Lista contactos con filtros.",
    flags: "--plan free|paid|monthly|yearly --active true|false --after YYYY-MM-DD --before YYYY-MM-DD --email texto --limit N --offset N",
    run: (db, f) =>
      q.listSubscribers(db, {
        plan: str(f, "plan"),
        is_active: bool(f, "active"),
        subscribed_after: str(f, "after"),
        subscribed_before: str(f, "before"),
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
    summary: "Free activos ordenados como candidatos a pago por engagement real (activity, aperturas 30d).",
    flags: "--limit N --min-days N",
    run: (db, f) => q.findUpgradeCandidates(db, int(f, "limit", 50), int(f, "min-days", 14)),
  },
  posts: {
    summary: "Posts con views, open_rate, signups y subscribes.",
    flags: `--sort ${POST_SORTS.join("|")} --limit N`,
    run: (db, f) => q.getPostPerformance(db, enumFlag(f, "sort", POST_SORTS, "post_date"), int(f, "limit", 50)),
  },
  growth: {
    summary: "Altas por fuente y series diarias free/paid, agrupadas.",
    flags: `--from YYYY-MM-DD --to YYYY-MM-DD --group-by ${GROUPS.join("|")}`,
    run: (db, f) => q.getGrowth(db, str(f, "from"), str(f, "to"), enumFlag(f, "group-by", GROUPS, "month")),
  },
  churn: {
    summary: "Bajas y transiciones de plan entre syncs (necesita ≥2 syncs).",
    flags: "--from YYYY-MM-DD --to YYYY-MM-DD",
    run: (db, f) => q.getChurn(db, str(f, "from"), str(f, "to")),
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
