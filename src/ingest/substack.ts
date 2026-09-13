import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { collectNotes, type NoteCounts } from "./notes.js";
import {
  DEFAULT_FROM, LIST_PAGE, PUB, SUBSCRIBER_EXPORT_COLUMNS, SUBSCRIBER_SET_QUERY, dateChunks, pubOrigin,
  rowsToCsv, today,
} from "./endpoints.js";

export { SUBSCRIBER_EXPORT_COLUMNS, dateChunks };

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
  /**
   * Estado de las notas ya guardadas. Presente = sync incremental: solo se piden las interacciones
   * de las notas cuyos contadores han cambiado. Ausente = sync completo.
   */
  knownNotes?: { counts: Map<number, NoteCounts>; withStats: Set<number> };
  /**
   * Desde cuándo pedir las series temporales. En incremental basta con los últimos meses: las
   * filas viejas ya están en la BD y no cambian. `traffic` se pide por tramos de 90 días, así que
   * acortar el rango es la diferencia entre 11 peticiones y 1.
   */
  seriesFrom?: string;
}

export interface Delays {
  retryBaseMs: number;
  pollMs: number;
  /** Pausa mínima entre peticiones GET; Substack devuelve 429 si se encadenan sin respiro. */
  pauseMs: number;
  /** Timeout por petición. Una conexión colgada no debe bloquear el sync entero. */
  timeoutMs: number;
}
const DEFAULT_DELAYS: Delays = { retryBaseMs: 1500, pollMs: 2000, pauseMs: 250, timeoutMs: 60_000 };

function isSubstack(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("substack.com");
  } catch {
    return false;
  }
}

export interface IngestReport {
  rawDir: string;
  downloaded: { kind: string; path: string; bytes: number }[];
  failed: { kind: string; error: string }[];
  sessionExpired: boolean;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

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
    this.base = pubOrigin(subdomain);
    this.fetchImpl = fetchImpl ?? fetch;
    this.delays = { ...DEFAULT_DELAYS, ...delays };
  }

  /**
   * La cookie de sesión solo viaja a Substack. El export de suscriptores se descarga de una URL
   * firmada de S3, y mandarle la sesión allí sería regalar la cuenta a un tercero sin necesidad:
   * la firma ya autoriza esa descarga.
   */
  private headers(extra: Record<string, string> = {}, url = this.base): Record<string, string> {
    const h: Record<string, string> = { "user-agent": UA, ...extra };
    if (isSubstack(url)) {
      h.cookie = this.cookie;
      h.referer = `${this.base}/publish/home`;
    }
    return h;
  }

  /**
   * Una petición con timeout. Sin él, una conexión colgada bloquea el sync hasta que caduca el
   * candado, quince minutos después.
   */
  private async once(url: string, init: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.delays.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Reintentos ante 5xx (503 esporádicos), 429 (con Retry-After si viene) y errores de red:
   * un ECONNRESET a mitad de sync es tan transitorio como un 503 y antes tumbaba el paso entero.
   */
  private async request(url: string, init: RequestInit, what: string, attempts = 5): Promise<Response> {
    let last: Response | undefined;
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      if (this.delays.pauseMs) await sleep(this.delays.pauseMs);
      let res: Response;
      try {
        res = await this.once(url, init);
      } catch (e) {
        lastErr = e;
        last = undefined;
        const wait = this.delays.retryBaseMs * (i + 1);
        this.log(`  red en ${what} (${e instanceof Error ? e.message : String(e)}) — reintento en ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (res.status === 401 || res.status === 403 || res.url.includes("/sign-in")) {
        throw new SessionExpiredError(`HTTP ${res.status} en ${what}`);
      }
      if (res.ok) return res;
      last = res;
      if (res.status !== 429 && res.status < 500) break;
      const retryAfter = Number(res.headers.get("retry-after")) * 1000;
      const wait = res.status === 429 ? Math.max(retryAfter || 0, this.delays.retryBaseMs * 2 ** (i + 1)) : this.delays.retryBaseMs * (i + 1);
      this.log(`  ${res.status} en ${what} — reintento en ${wait}ms`);
      await sleep(wait);
    }
    if (last) throw new Error(`HTTP ${last.status} en ${what}`);
    throw new Error(`sin respuesta en ${what}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
  }

  async get(path: string, accept = "*/*", attempts = 5): Promise<Response> {
    const url = path.startsWith("http") ? path : this.base + path;
    const what = path.replace(/^https?:\/\/[^/]+/, "").slice(0, 120);
    return this.request(url, { headers: this.headers({ accept }, url), redirect: "follow" }, what, attempts);
  }

  /** JSON ya parseado, con los mismos reintentos que `get`. */
  async getJson<T>(path: string): Promise<T> {
    return (await (await this.get(path, "application/json")).json()) as T;
  }

  async postJson<T>(path: string, body: unknown): Promise<T> {
    const url = this.base + path;
    const res = await this.request(
      url,
      {
        method: "POST",
        headers: this.headers({ "content-type": "application/json", accept: "application/json" }, url),
        body: JSON.stringify(body),
      },
      path,
    );
    const text = await res.text();
    return JSON.parse(text) as T;
  }

  async csv(path: string): Promise<string> {
    const text = await (await this.get(path, "text/csv,*/*")).text();
    if (/^\s*<!doctype html/i.test(text)) throw new SessionExpiredError("la respuesta es HTML (login) en vez de CSV");
    return text;
  }

  emailStats() {
    return this.csv(PUB.emailStats());
  }

  /**
   * Una sola petición: `resolution=day` conserva el detalle diario en cualquier rango. Sin ese
   * parámetro Substack agrega por mes y había que trocear en 11 peticiones.
   */
  traffic(from = DEFAULT_FROM, to = today()) {
    return this.csv(PUB.traffic(from, to));
  }

  /** Serie diaria de seguidores. Llega sin cabecera, como la de suscriptores totales. */
  async followers(from = DEFAULT_FROM) {
    const body = await this.csv(PUB.followers(from));
    return `date,followers\n${body.trim()}\n`;
  }

  /** Bajas con fecha real, paginadas de 20 en 20. */
  async unsubscribes(from = DEFAULT_FROM, to = today()): Promise<string> {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; offset < 5_000; offset += LIST_PAGE) {
      const page = await this.getJson<{ rows?: Record<string, unknown>[]; total?: number }>(
        PUB.unsubscribes(from, to, offset),
      );
      const got = page.rows ?? [];
      rows.push(...got);
      if (got.length < LIST_PAGE) break;
    }
    const header = ["email", "unsubscribed_at", "subscribed_at", "plan", "source", "name"];
    return rowsToCsv(
      header,
      rows.map((r) => [
        str(r.email ?? r.user_email_address ?? (r.user as Record<string, unknown> | undefined)?.email),
        str(r.unsubscribed_at ?? r.unsubscribedAt ?? r.date),
        str(r.subscription_created_at ?? r.subscribed_at ?? r.created_at),
        str(r.type ?? r.subscription_type ?? r.plan),
        str(r.free_attribution ?? r.source),
        str(r.name ?? (r.user as Record<string, unknown> | undefined)?.name),
      ]),
    );
  }

  /** Serie diaria de bajas. Es la única fuente de bajas por día que expone el panel. */
  async unsubscribesDaily(from = DEFAULT_FROM, to = today()): Promise<string> {
    const data = await this.getJson<{ rows?: unknown[] }>(PUB.unsubscribesDaily(from, to));
    const rows = (data.rows ?? []) as (Record<string, unknown> | [string, number])[];
    return rowsToCsv(
      ["date", "unsubscribes"],
      rows.map((r) =>
        Array.isArray(r) ? [str(r[0]), Number(r[1]) || 0] : [str(r.date ?? r.dt), Number(r.count ?? r.value ?? r.unsubscribes) || 0],
      ),
    );
  }

  visitorSources(from = DEFAULT_FROM, to = today()) {
    return this.csv(PUB.visitorSources(from, to));
  }

  /** De dónde viene la audiencia: red de Substack, cuentas existentes, importados, fuera. */
  async networkAttribution(): Promise<string> {
    const data = await this.getJson<{ rows?: Record<string, unknown>[] }>(PUB.networkAttribution());
    return rowsToCsv(
      ["label", "time_window", "subscribers", "pct_of_total"],
      (data.rows ?? []).map((r) => [str(r.label), str(r.time_window), Number(r.subs_count) || 0, Number(r.pct_time_window_total) || 0]),
    );
  }

  async audienceLocation(): Promise<string> {
    const data = await this.getJson<Record<string, unknown>[]>(PUB.audienceLocation());
    return rowsToCsv(
      ["location", "metric", "value"],
      (Array.isArray(data) ? data : []).map((r) => [str(r.location), str(r.metric), Number(r.value) || 0]),
    );
  }

  /**
   * Publicaciones con audiencia solapada. La respuesta trae el objeto entero de cada publicación
   * (130 KB para doce filas); aquí se queda en lo que se consulta.
   */
  async audienceOverlap(): Promise<string> {
    const data = await this.getJson<{ percentOverlap?: string; pub?: Record<string, unknown> }[]>(PUB.audienceOverlap());
    return rowsToCsv(
      ["subdomain", "name", "percent_overlap", "author"],
      (Array.isArray(data) ? data : []).map((r) => [
        str(r.pub?.subdomain),
        str(r.pub?.name),
        Number(r.percentOverlap) || 0,
        str(r.pub?.author_name),
      ]),
    );
  }

  /** Quién te trae lectores. */
  async readerReferrals(to = today()): Promise<string> {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; offset < 1_000; offset += LIST_PAGE) {
      const page = await this.getJson<{ rows?: Record<string, unknown>[] }>(PUB.readerReferrals(to, offset));
      const got = page.rows ?? [];
      rows.push(...got);
      if (got.length < LIST_PAGE) break;
    }
    return rowsToCsv(
      ["user_id", "name", "handle", "visitors", "free_subscribers", "paid_subscribers"],
      rows.map((r) => {
        const u = (r.user ?? {}) as Record<string, unknown>;
        return [
          str(r.referrer_user_id ?? u.id),
          str(u.name),
          str(u.handle),
          Number(r.visitors) || 0,
          Number(r.free_subscribers) || 0,
          Number(r.paid_subscribers) || 0,
        ];
      }),
    );
  }

  /**
   * Las cifras sueltas del panel (retención, referidos, crecimiento de pago, apertura y visitas
   * de 30 días) en una tabla clave/valor: son cinco peticiones diminutas y un solo archivo.
   */
  async summaries(): Promise<string> {
    const out: [string, string][] = [];
    const add = (prefix: string, obj: unknown) => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (v === null || typeof v === "object") continue;
        out.push([`${prefix}.${k}`, String(v)]);
      }
    };
    const tasks: [string, string][] = [
      ["retention", PUB.retentionSummary()],
      ["referrals", PUB.referralsSummary()],
      ["paid_growth", PUB.paidGrowthSummary()],
      ["open_rate_30d", PUB.openRate30d()],
      ["views_30d", PUB.views30d()],
    ];
    for (const [prefix, path] of tasks) {
      try {
        const data = await this.getJson<Record<string, unknown>>(path);
        add(prefix, prefix === "retention" ? (data.heroStat ?? data) : data);
      } catch (e) {
        if (e instanceof SessionExpiredError) throw e;
        this.log(`  ✗ resumen ${prefix}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return rowsToCsv(["metric", "value"], out);
  }

  growthSources(from = DEFAULT_FROM, to = today()) {
    return this.csv(PUB.growthSources(from, to));
  }

  paidSubscriberGrowth(from = DEFAULT_FROM, to = today()) {
    return this.csv(PUB.paidSubscriberGrowth(from, to));
  }

  /** Serie diaria de suscriptores totales. Substack la devuelve sin cabecera; se la añadimos. */
  async subscriberTotals(from = DEFAULT_FROM) {
    const body = await this.csv(PUB.subscriberTotals(from));
    return `date,total_subscribers\n${body.trim()}\n`;
  }

  /** Export completo de suscriptores: crea un set, pide el export, sondea hasta tener URL y descarga. */
  async subscriberExport(maxPolls = 60): Promise<string> {
    const set = await this.postJson<{ id: number }>(PUB.subscriberSet(), { query: SUBSCRIBER_SET_QUERY });
    if (!set?.id) throw new Error(`subscriber_set sin id: ${JSON.stringify(set).slice(0, 200)}`);
    const exp = await this.postJson<Record<string, unknown>>(PUB.subscriberExport(), {
      subscriberSetId: set.id,
      columns: [...SUBSCRIBER_EXPORT_COLUMNS],
    });
    const exportId = (exp.id ?? exp.exportId ?? exp.export_id) as string | undefined;
    let fileUrl = exp.url as string | undefined;
    if (!fileUrl) {
      if (!exportId) throw new Error(`export sin id ni url: ${JSON.stringify(exp).slice(0, 200)}`);
      // Mientras el export se genera, el endpoint de estado responde 400; se sondea hasta que trae `url`.
      for (let i = 0; i < maxPolls && !fileUrl; i++) {
        await sleep(this.delays.pollMs);
        const res = await this.fetchImpl(this.base + PUB.subscriberExportStatus(exportId), {
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
      const page = (await (await this.get(PUB.archive(offset), "application/json")).json()) as ArchivePost[];
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

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function ingestSubstack(opts: IngestOptions): Promise<IngestReport> {
  const log = opts.log ?? (() => {});
  mkdirSync(opts.rawDir, { recursive: true });
  const client = new SubstackClient(opts.subdomain, opts.cookie, log, opts.fetchImpl, opts.delays);
  const desde = opts.seriesFrom ?? DEFAULT_FROM;
  const report: IngestReport = { rawDir: opts.rawDir, downloaded: [], failed: [], sessionExpired: false };

  const steps: { kind: string; file: string; run: () => Promise<string> }[] = [
    { kind: "email_list", file: "email_list.csv", run: () => client.subscriberExport() },
    { kind: "posts", file: "posts.csv", run: () => client.postsCsv() },
    { kind: "email_stats", file: "email_stats.csv", run: () => client.emailStats() },
    { kind: "growth_sources", file: "growth_sources.csv", run: () => client.growthSources(desde) },
    { kind: "traffic", file: "traffic.csv", run: () => client.traffic(desde) },
    { kind: "paid_subscriber_growth", file: "paid_subscriber_growth.csv", run: () => client.paidSubscriberGrowth(desde) },
    { kind: "subscriber_totals", file: "subscriber_totals.csv", run: () => client.subscriberTotals(desde) },
    { kind: "followers", file: "followers.csv", run: () => client.followers(desde) },
    { kind: "unsubscribes", file: "unsubscribes.csv", run: () => client.unsubscribes(desde) },
    { kind: "unsubscribes_daily", file: "unsubscribes_daily.csv", run: () => client.unsubscribesDaily(desde) },
    { kind: "visitor_sources", file: "visitor_sources.csv", run: () => client.visitorSources(desde) },
    { kind: "network_attribution", file: "network_attribution.csv", run: () => client.networkAttribution() },
    { kind: "audience_location", file: "audience_location.csv", run: () => client.audienceLocation() },
    { kind: "audience_overlap", file: "audience_overlap.csv", run: () => client.audienceOverlap() },
    { kind: "referrers", file: "referrers.csv", run: () => client.readerReferrals() },
    { kind: "pub_summary", file: "pub_summary.csv", run: () => client.summaries() },
    {
      kind: "notes",
      file: "notes.json",
      run: async () => {
        const bundle = await collectNotes(client, {
          log,
          known: opts.knownNotes?.counts,
          withStats: opts.knownNotes?.withStats,
        });
        if (bundle.errors.length) log(`  ${bundle.errors.length} peticiones de notas fallaron (se conserva el resto)`);
        return JSON.stringify(bundle);
      },
    },
  ];

  for (const step of steps) {
    try {
      const t0 = Date.now();
      log(`→ ${step.kind}`);
      const text = await step.run();
      log(`  ${step.kind}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      // Una cabecera sin filas es un resultado legítimo (cero bajas, cero ingresos). Solo es un
      // error si no llega nada: cuerpo vacío o una página de login disfrazada.
      if (!step.file.endsWith(".json") && !text.trim()) throw new Error("respuesta vacía");
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
