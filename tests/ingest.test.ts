import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { cookieFromCurl } from "../src/ingest/auth.js";
import { ingestSubstack, SUBSCRIBER_EXPORT_COLUMNS, dateChunks } from "../src/ingest/substack.js";
import { detectKind, readCsv } from "../src/load/csv.js";
import { normalizeSubscriberRow } from "../src/load/subscriberRow.js";

describe("cookieFromCurl", () => {
  it("extrae -b con continuaciones de línea", () => {
    const curl = `curl 'https://x.substack.com/publish/home' \\\n  -H 'accept: text/html' \\\n  -b 'a=1; substack.sid=s%3Aabc; b=2' \\\n  -H 'user-agent: UA'`;
    expect(cookieFromCurl(curl)).toBe("a=1; substack.sid=s%3Aabc; b=2");
  });
  it("acepta -H cookie:", () => {
    expect(cookieFromCurl(`curl 'u' -H 'cookie: substack.sid=zzz; x=1'`)).toBe("substack.sid=zzz; x=1");
  });
  it("rechaza cURL sin sesión", () => {
    expect(() => cookieFromCurl(`curl 'u' -b 'a=1'`)).toThrow(/substack\.sid/);
    expect(() => cookieFromCurl(`curl 'u'`)).toThrow(/cookies/);
  });
});

describe("normalizeSubscriberRow (formato actual)", () => {
  it("mapea Type/Activity/Start date y guarda engagement en extra", () => {
    const r = normalizeSubscriberRow({
      Email: "A@X.com", Name: "Ana", "Stripe plan": "", "Cancel date": "", "Start date": "2026-06-17T10:21:38.759Z",
      "Paid upgrade date": "", Activity: "4", "Emails opened (30d)": "3", "Days active (30d)": "7",
      "Subscription source (free)": "substack-notes", Type: "Free", Country: "ES", "Group membership": "None",
    })!;
    expect(r.email).toBe("a@x.com");
    expect(r.plan).toBe("free");
    expect(r.isActive).toBe(1);
    expect(r.source).toBe("substack-notes");
    expect(r.createdAt).toBe("2026-06-17T10:21:38.759Z");
    expect(r.extra).toMatchObject({ name: "Ana", activity: 4, emails_opened_30d: 3, days_active_30d: 7, country: "ES", "Group membership": "None" });
  });
  it("detecta pago por Type + Stripe plan y baja por Cancel date", () => {
    const paid = normalizeSubscriberRow({ Email: "p@x.com", Type: "Paid", "Stripe plan": "Monthly", "Start date": "2026-01-01", "Paid upgrade date": "2026-02-01", "Cancel date": "" })!;
    expect(paid.plan).toBe("monthly");
    expect(paid.paidSince).toBe("2026-02-01");
    const gone = normalizeSubscriberRow({ Email: "g@x.com", Type: "Free", "Start date": "2026-01-01", "Cancel date": "2026-03-01" })!;
    expect(gone.isActive).toBe(0);
    expect(gone.unsubscribedAt).toBe("2026-03-01");
    const author = normalizeSubscriberRow({ Email: "me@x.com", Type: "Author", "Start date": "2026-01-01" })!;
    expect(author.plan).toBe("author");
  });
});

/** fetch falso que simula los endpoints del panel de Substack, incluido el 503 inicial y el export asíncrono. */
function fakeSubstack() {
  let emailStatsCalls = 0;
  let exportPolls = 0;
  const seen: { url: string; method: string; body?: string }[] = [];
  const text = (body: string, status = 200, headers: Record<string, string> = {}) =>
    new Response(body, { status, headers: { "content-type": "text/csv", ...headers } });
  const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { "content-type": "application/json" } });
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url ?? String(input);
    const method = init?.method ?? "GET";
    seen.push({ url, method, body: typeof init?.body === "string" ? init.body : undefined });
    const path = url.replace(/^https:\/\/[^/]+/, "");
    if (path.startsWith("/api/v1/publication/stats/email_stats")) {
      if (emailStatsCalls++ === 0) return text("", 503);
      return text("title,post_date,audience,views,engagement_rate,signups,subscribes,estimated_value,open_rate\nA,2026-07-18T00:00:00.000Z,everyone,1,0.1,0,0,0,0.5\n");
    }
    if (path.startsWith("/api/v1/publication/stats/publication_traffic/timeseries")) {
      const from = new URL(url).searchParams.get("from")!.replace(/-/g, "/");
      return text(`Date,Views\n${from},10\n`);
    }
    if (path.startsWith("/api/v1/publication/stats/growth/sources")) return text("Date,Source,Category,Unique visitors,New subscribers,New revenue\n2026/06/09,Direct,Other,1,0,0\n");
    if (path.startsWith("/api/v1/publication/stats/paid_subscriber_growth")) return text("date,new_paid,upgrades,trials_started,cancellations_initiated,cancellations_finalized\n2026/08/22,1,1,0,0,0\n");
    if (path.startsWith("/api/v1/publication/stats/emails/timeseries")) return text("2026/06/09,1\n2026/06/10,2\n");
    if (path === "/api/v1/subscriber_set" && method === "POST") return json({ id: 42 });
    if (path === "/api/v1/subscriber_set/export" && method === "POST") return json({ id: "exp1" });
    if (path === "/api/v1/subscriber_set/export/exp1") {
        // Primera consulta: aún generándose (400). Segunda: lista.
      if (exportPolls++ === 0) return text("", 400);
      return json({ url: "/api/v1/subscriber_set/export/exp1/file" });
    }
    if (path === "/api/v1/subscriber_set/export/exp1/file")
      return text("Email,Name,Stripe plan,Cancel date,Start date,Paid upgrade date,Activity,Type\na@x.com,Ana,,,2026-06-17T10:21:38.759Z,,4,Free\n");
    if (path.startsWith("/api/v1/archive")) {
      const offset = Number(new URL(url).searchParams.get("offset"));
      return json(offset === 0 ? [{ id: 1, slug: "a", title: "A, con coma", post_date: "2026-07-18T00:00:00.000Z", audience: "everyone", type: "newsletter", canonical_url: "https://x/p/a", wordcount: 10 }] : []);
    }
    return text("not found", 404);
  };
  return { fetchImpl, seen };
}

describe("dateChunks", () => {
  it("cubre el rango sin huecos ni solapes", () => {
    expect(dateChunks("2026-01-01", "2026-01-10", 4)).toEqual([
      ["2026-01-01", "2026-01-04"],
      ["2026-01-05", "2026-01-08"],
      ["2026-01-09", "2026-01-10"],
    ]);
    expect(dateChunks("2026-01-01", "2025-12-31", 4)).toEqual([]);
  });
});

describe("ingestSubstack", () => {
  it("descarga los 7 exports por API, reintenta 503 y produce CSV que el loader reconoce", async () => {
    const { fetchImpl, seen } = fakeSubstack();
    const rawDir = mkdtempSync(join(tmpdir(), "constack-ing-"));
    const rep = await ingestSubstack({ subdomain: "x", rawDir, cookie: "substack.sid=s", fetchImpl, delays: { retryBaseMs: 1, pollMs: 1 } });
    expect(rep.failed).toEqual([]);
    expect(rep.downloaded.map((d) => d.kind).sort()).toEqual(
      ["email_list", "email_stats", "growth_sources", "paid_subscriber_growth", "posts", "subscriber_totals", "traffic"].sort(),
    );
    for (const d of rep.downloaded) {
      expect(existsSync(d.path)).toBe(true);
      const { headers } = readCsv(d.path);
      expect(detectKind(headers)).toBe(d.kind);
    }
    const exportCall = seen.find((s) => s.url.endsWith("/subscriber_set/export") && s.method === "POST")!;
    expect(JSON.parse(exportCall.body!)).toEqual({ subscriberSetId: 42, columns: SUBSCRIBER_EXPORT_COLUMNS });
    expect(seen.every((s) => (s as any).url.includes("substack.com") || s.url.startsWith("/"))).toBe(true);
    const traffic = readFileSync(join(rawDir, "traffic.csv"), "utf8").trim().split("\n");
    expect(traffic[0]).toBe("Date,Views");
    expect(traffic.length).toBeGreaterThan(5); // varios tramos de 90 días concatenados bajo una sola cabecera
    expect(traffic.filter((l) => l === "Date,Views")).toHaveLength(1);
    const posts = readFileSync(join(rawDir, "posts.csv"), "utf8");
    expect(posts).toContain('"A, con coma"');
    expect(posts.split("\n")[1]).toMatch(/^1\.a,2026-07-18/);
  });

  it("corta al detectar sesión caducada", async () => {
    const fetchImpl: typeof fetch = async () => new Response("<!doctype html><html>login</html>", { status: 200, headers: { "content-type": "text/html" } });
    const rep = await ingestSubstack({ subdomain: "x", rawDir: mkdtempSync(join(tmpdir(), "constack-ing-")), cookie: "substack.sid=s", fetchImpl });
    expect(rep.sessionExpired).toBe(true);
    expect(rep.downloaded).toEqual([]);
  });
});
