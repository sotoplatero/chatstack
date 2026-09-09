import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cliente HTTP contra los endpoints internos del panel de Substack, autenticado con la
 * cookie de sesión del propietario. Son los mismos endpoints que usa el botón "Descargar CSV"
 * del panel (capturados el 2026-09-09); devuelven 503 esporádicos, de ahí los reintentos.
 */

export interface IngestOptions {
  subdomain: string;
  rawDir: string;
  cookie: string;
  log?: (msg: string) => void;
  fetchImpl?: typeof fetch;
  /** Esperas entre reintentos/sondeos; los tests las acortan. */
  delays?: Partial<Delays>;
}

export interface Delays {
  retryBaseMs: number;
  pollMs: number;
}
const DEFAULT_DELAYS: Delays = { retryBaseMs: 1500, pollMs: 2000 };

export interface IngestReport {
  rawDir: string;
  downloaded: { kind: string; path: string; bytes: number }[];
  failed: { kind: string; error: string }[];
  sessionExpired: boolean;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

/** Columnas del export "todas las columnas" de Audiencia → Exportar (incluye engagement por contacto). */
export const SUBSCRIBER_EXPORT_COLUMNS = [
  "user_email_address", "user_name", "subscription_type", "activity_rating", "subscription_created_at",
  "total_revenue_generated", "num_comments", "num_comments_last_7d", "num_comments_last_30d", "num_shares",
  "num_shares_last_7d", "num_shares_last_30d", "country", "state", "num_emails_received", "num_emails_dropped",
  "num_emails_opened", "num_email_opens", "num_email_opens_last_7d", "num_email_opens_last_30d", "last_opened_at",
  "links_clicked", "last_clicked_at", "num_unique_email_posts_seen", "num_unique_email_posts_seen_last_7d",
  "num_unique_email_posts_seen_last_30d", "num_web_post_views", "num_web_post_views_last_7d",
  "num_web_post_views_last_30d", "num_unique_web_posts_seen", "num_unique_web_posts_seen_last_7d",
  "num_unique_web_posts_seen_last_30d", "num_subs_gifted", "subscription_expires_at", "free_attribution",
  "paid_attribution", "days_active_last_30d", "first_payment_at", "last_subscribed_at", "unsubscribed_at",
  "emails_enabled", "bestseller_tier", "stripe_plan_name", "group_membership",
];

const EMAIL_STATS_COLUMNS = ["title", "post_date", "audience", "views", "engagement_rate", "signups", "subscribes", "estimated_value", "open_rate"];

export class SessionExpiredError extends Error {}

export class SubstackClient {
  private readonly base: string;
  private readonly fetchImpl: typeof fetch;
  private readonly delays: Delays;
  constructor(
    subdomain: string,
    private readonly cookie: string,
    private readonly log: (m: string) => void = () => {},
    fetchImpl?: typeof fetch,
    delays: Partial<Delays> = {},
  ) {
    this.base = `https://${subdomain}.substack.com`;
    this.fetchImpl = fetchImpl ?? fetch;
    this.delays = { ...DEFAULT_DELAYS, ...delays };
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { "user-agent": UA, cookie: this.cookie, referer: `${this.base}/publish/home`, ...extra };
  }

  /** GET con reintentos ante 5xx (Substack devuelve 503 a la primera con frecuencia). */
  async get(path: string, accept = "*/*", attempts = 5): Promise<Response> {
    const url = path.startsWith("http") ? path : this.base + path;
    let last: Response | undefined;
    for (let i = 0; i < attempts; i++) {
      const res = await this.fetchImpl(url, { headers: this.headers({ accept }), redirect: "follow" });
      if (res.status === 401 || res.status === 403 || res.url.includes("/sign-in")) throw new SessionExpiredError(`HTTP ${res.status} en ${path}`);
      if (res.ok) return res;
      last = res;
      if (res.status < 500) break;
      const wait = this.delays.retryBaseMs * (i + 1);
      this.log(`  ${res.status} en ${path} — reintento en ${wait}ms`);
      await sleep(wait);
    }
    throw new Error(`HTTP ${last?.status} en ${path}`);
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchImpl(this.base + path, {
      method: "POST",
      headers: this.headers({ "content-type": "application/json", accept: "application/json" }),
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) throw new SessionExpiredError(`HTTP ${res.status} en ${path}`);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}: ${text.slice(0, 300)}`);
    return JSON.parse(text) as T;
  }

  async csv(path: string): Promise<string> {
    const text = await (await this.get(path, "text/csv,*/*")).text();
    if (/^\s*<!doctype html/i.test(text)) throw new SessionExpiredError("la respuesta es HTML (login) en vez de CSV");
    return text;
  }

  emailStats() {
    const q = EMAIL_STATS_COLUMNS.map((c) => `columns%5B%5D=${c}`).join("&");
    return this.csv(`/api/v1/publication/stats/email_stats?format=csv&${q}`);
  }

  /** Substack agrega por mes si el rango es amplio; se pide en tramos de 90 días para conservar el detalle diario. */
  async traffic(from = "2024-01-01", to = today()) {
    let header = "";
    const lines: string[] = [];
    for (const [a, b] of dateChunks(from, to, 90)) {
      const text = await this.csv(`/api/v1/publication/stats/publication_traffic/timeseries?from=${a}&to=${b}&format=csv`);
      const [h, ...rows] = text.trim().split(/\r?\n/);
      header ||= h;
      lines.push(...rows.filter(Boolean));
    }
    return `${header}\n${lines.join("\n")}\n`;
  }

  growthSources(from = "2024-01-01", to = today()) {
    return this.csv(`/api/v1/publication/stats/growth/sources?from_date=${from}&to_date=${to}&format=csv`);
  }

  paidSubscriberGrowth(from = "2024-01-01", to = today()) {
    return this.csv(`/api/v1/publication/stats/paid_subscriber_growth?start=${from}&end=${to}&period=day&format=csv`);
  }

  /** Serie diaria de suscriptores totales. Substack la devuelve sin cabecera; se la añadimos. */
  async subscriberTotals(from = "2024-01-01") {
    const body = await this.csv(`/api/v1/publication/stats/emails/timeseries?from=${from}T00:00:00.000Z&format=csv&resolution=day`);
    return `date,total_subscribers\n${body.trim()}\n`;
  }

  /** Export completo de suscriptores: crea un set, pide el export, sondea hasta tener URL y descarga. */
  async subscriberExport(maxPolls = 60): Promise<string> {
    const set = await this.postJson<{ id: number }>("/api/v1/subscriber_set", {
      query: { order_by_desc_nulls_last: "subscription_created_at" },
    });
    if (!set?.id) throw new Error(`subscriber_set sin id: ${JSON.stringify(set).slice(0, 200)}`);
    const exp = await this.postJson<Record<string, unknown>>("/api/v1/subscriber_set/export", {
      subscriberSetId: set.id,
      columns: SUBSCRIBER_EXPORT_COLUMNS,
    });
    const exportId = (exp.id ?? exp.exportId ?? exp.export_id) as string | undefined;
    let fileUrl = exp.url as string | undefined;
    if (!fileUrl) {
      if (!exportId) throw new Error(`export sin id ni url: ${JSON.stringify(exp).slice(0, 200)}`);
      // Mientras el export se genera, el endpoint de estado responde 400; se sondea hasta que trae `url`.
      for (let i = 0; i < maxPolls && !fileUrl; i++) {
        await sleep(this.delays.pollMs);
        const res = await this.fetchImpl(`${this.base}/api/v1/subscriber_set/export/${exportId}`, {
          headers: this.headers({ accept: "application/json" }),
        });
        if (res.status === 401 || res.status === 403) throw new SessionExpiredError(`HTTP ${res.status} consultando el export`);
        if (!res.ok) continue;
        const st = (await res.json()) as { url?: string };
        fileUrl = st.url;
      }
      if (!fileUrl) throw new Error("el export de suscriptores no estuvo listo a tiempo");
    }
    return this.csv(fileUrl.startsWith("http") ? fileUrl : this.base + fileUrl);
  }

  /** Posts publicados vía /api/v1/archive, convertidos al mismo CSV que el export oficial (posts.csv). */
  async postsCsv(): Promise<string> {
    const rows: string[][] = [];
    for (let offset = 0; ; offset += 50) {
      const page = (await (await this.get(`/api/v1/archive?sort=new&limit=50&offset=${offset}`, "application/json")).json()) as ArchivePost[];
      if (!Array.isArray(page) || page.length === 0) break;
      for (const p of page) {
        rows.push([
          `${p.id}.${p.slug ?? ""}`, p.post_date ?? "", "true", p.email_sent_at ?? "", p.email_sent_at ?? "",
          p.type ?? "", p.audience ?? "", p.title ?? "", p.subtitle ?? "", p.podcast_url ?? "",
          p.canonical_url ?? "", p.wordcount != null ? String(p.wordcount) : "",
        ]);
      }
      if (page.length < 50) break;
    }
    const header = ["post_id", "post_date", "is_published", "email_sent_at", "inbox_sent_at", "type", "audience", "title", "subtitle", "podcast_url", "canonical_url", "wordcount"];
    return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
  }
}

interface ArchivePost {
  id: number; slug?: string; title?: string; subtitle?: string; post_date?: string; audience?: string; type?: string;
  canonical_url?: string; wordcount?: number; email_sent_at?: string | null; podcast_url?: string | null;
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Pares [desde, hasta] consecutivos de `days` días que cubren [from, to]. */
export function dateChunks(from: string, to: string, days: number): [string, string][] {
  const out: [string, string][] = [];
  let a = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (a <= end) {
    const b = new Date(Math.min(a.getTime() + (days - 1) * 86_400_000, end.getTime()));
    out.push([a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]);
    a = new Date(b.getTime() + 86_400_000);
  }
  return out;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function ingestSubstack(opts: IngestOptions): Promise<IngestReport> {
  const log = opts.log ?? (() => {});
  mkdirSync(opts.rawDir, { recursive: true });
  const client = new SubstackClient(opts.subdomain, opts.cookie, log, opts.fetchImpl, opts.delays);
  const report: IngestReport = { rawDir: opts.rawDir, downloaded: [], failed: [], sessionExpired: false };

  const steps: { kind: string; file: string; run: () => Promise<string> }[] = [
    { kind: "email_list", file: "email_list.csv", run: () => client.subscriberExport() },
    { kind: "posts", file: "posts.csv", run: () => client.postsCsv() },
    { kind: "email_stats", file: "email_stats.csv", run: () => client.emailStats() },
    { kind: "growth_sources", file: "growth_sources.csv", run: () => client.growthSources() },
    { kind: "traffic", file: "traffic.csv", run: () => client.traffic() },
    { kind: "paid_subscriber_growth", file: "paid_subscriber_growth.csv", run: () => client.paidSubscriberGrowth() },
    { kind: "subscriber_totals", file: "subscriber_totals.csv", run: () => client.subscriberTotals() },
  ];

  for (const step of steps) {
    try {
      log(`→ ${step.kind}`);
      const text = await step.run();
      if (text.trim().split(/\r?\n/).length < 2) throw new Error("respuesta vacía");
      const path = join(opts.rawDir, step.file);
      writeFileSync(path, text, "utf8");
      report.downloaded.push({ kind: step.kind, path, bytes: Buffer.byteLength(text) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`  ✗ ${step.kind}: ${msg}`);
      report.failed.push({ kind: step.kind, error: msg });
      if (e instanceof SessionExpiredError) {
        report.sessionExpired = true;
        break;
      }
    }
  }
  return report;
}
