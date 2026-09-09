import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export type Row = Record<string, string>;

export type CsvKind =
  | "email_list"
  | "email_stats"
  | "growth_sources"
  | "traffic"
  | "posts"
  | "free_subscriber_growth"
  | "paid_subscriber_growth"
  | "unknown";

/** Cabeceras que identifican cada export de Substack. Se detecta por contenido, no por nombre. */
const SIGNATURES: Record<Exclude<CsvKind, "unknown">, string[]> = {
  email_list: ["email", "active_subscription", "created_at"],
  email_stats: ["title", "post_date", "open_rate"],
  growth_sources: ["date", "source", "new subscribers"],
  traffic: ["date", "views"],
  posts: ["post_id", "post_date", "is_published"],
  free_subscriber_growth: ["date", "new_free"],
  paid_subscriber_growth: ["date", "new_paid"],
};

export function detectKind(headers: string[]): CsvKind {
  const h = new Set(headers.map((x) => x.trim().toLowerCase()));
  // Orden importa: traffic (date, views) es subconjunto de otros → se evalúa con igualdad estricta.
  if (h.size === 2 && h.has("date") && h.has("views")) return "traffic";
  for (const [kind, sig] of Object.entries(SIGNATURES) as [CsvKind, string[]][]) {
    if (kind === "traffic") continue;
    if (sig.every((c) => h.has(c))) return kind;
  }
  return "unknown";
}

export function readCsv(path: string): { rows: Row[]; headers: string[]; sha256: string } {
  const buf = readFileSync(path);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const text = buf.toString("utf8").replace(/^\uFEFF/, "");
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Row[];
  const headers = rows.length ? Object.keys(rows[0]) : firstLine(text);
  return { rows, headers, sha256 };
}

function firstLine(text: string): string[] {
  return (text.split(/\r?\n/)[0] ?? "").split(",").map((s) => s.trim());
}

/** Convierte "2026/06/09" → "2026-06-09"; deja ISO tal cual; devuelve null si vacío. */
export function normDate(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}

export function toInt(v: string | undefined): number | null {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v.replace(/[,$]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function toNum(v: string | undefined): number | null {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v.replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function toBool(v: string | undefined): boolean {
  return /^(true|1|yes|sí|si)$/i.test((v ?? "").trim());
}

/** Devuelve las columnas no consumidas como objeto JSON (para `extra`). */
export function rest(row: Row, used: string[]): string {
  const u = new Set(used);
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) if (!u.has(k) && v !== "") out[k] = v;
  return JSON.stringify(out);
}
