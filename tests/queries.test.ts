import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type Db } from "../src/db/index.js";
import { loadDirectory } from "../src/load/index.js";
import * as q from "../src/mcp/queries.js";

const V1 = `email,active_subscription,expiry,plan,email_disabled,created_at,first_payment_at
old@x.com,false,,other,false,2025-01-01T00:00:00.000Z,
new@x.com,false,,other,false,2026-09-01T00:00:00.000Z,
paid@x.com,true,,yearly,false,2025-06-01T00:00:00.000Z,2025-06-02T00:00:00.000Z
gone@x.com,false,,other,false,2025-03-01T00:00:00.000Z,
`;
const V2 = `email,active_subscription,expiry,plan,email_disabled,created_at,first_payment_at
old@x.com,true,,monthly,false,2025-01-01T00:00:00.000Z,2026-09-05T00:00:00.000Z
new@x.com,false,,other,false,2026-09-01T00:00:00.000Z,
paid@x.com,false,,other,false,2025-06-01T00:00:00.000Z,2025-06-02T00:00:00.000Z
`;
const POSTS = `post_id,post_date,is_published,email_sent_at,inbox_sent_at,type,audience,title,subtitle,podcast_url
1.a,2026-07-18T00:00:00.000Z,true,,,newsletter,everyone,A,,
2.b,2026-07-11T00:00:00.000Z,true,,,newsletter,everyone,B,,
`;
const STATS = `title,post_date,audience,views,engagement_rate,signups,subscribes,estimated_value,open_rate
A,2026-07-18T00:00:00.000Z,everyone,35,0.25,2,1,0,0.30
B,2026-07-11T00:00:00.000Z,everyone,24,0.375,0,0,0,0.88
`;
const GROWTH = `Date,Source,Category,Unique visitors,New subscribers,New revenue
2026/06/09,Direct,Other,1,1,0
2026/07/10,substack.com,Substack,10,3,0
`;

function dir(files: Record<string, string>) {
  const d = mkdtempSync(join(tmpdir(), "constack-q-"));
  for (const [n, c] of Object.entries(files)) writeFileSync(join(d, n), c);
  return d;
}

describe("queries", () => {
  let db: Db;
  beforeAll(() => {
    db = openDb(":memory:");
    loadDirectory(db, dir({ "l.csv": V1, "p.csv": POSTS, "s.csv": STATS, "g.csv": GROWTH }));
    loadDirectory(db, dir({ "l.csv": V2 }));
  });

  it("overview", () => {
    const o = q.getOverview(db) as any;
    expect(o.subscribers.total).toBe(4);
    expect(o.subscribers.active).toBe(3);
    expect(o.subscribers.active_paid).toBe(1);
    expect(o.last_sync.id).toBe(2);
  });

  it("list_subscribers filtra por plan 'paid' genérico", () => {
    const r = q.listSubscribers(db, { plan: "paid", is_active: true });
    expect(r.total).toBe(1);
    expect((r.rows[0] as any).email).toBe("old@x.com");
  });

  it("get_subscriber trae historial", () => {
    const s = q.getSubscriber(db, "OLD@x.com") as any;
    expect(s.plan).toBe("monthly");
    expect(s.history.map((h: any) => h.plan)).toEqual(["free", "monthly"]);
    expect(q.getSubscriber(db, "nope@x.com")).toBeNull();
  });

  it("find_upgrade_candidates declara proxy y excluye recientes", () => {
    const r = q.findUpgradeCandidates(db, 10, 14) as any;
    expect(r.method).toMatch(/PROXY/);
    // new@x.com tiene <14 días; old ya es paid; paid@x pasó a free y es antiguo → único candidato.
    expect(r.rows.map((x: any) => x.email)).toEqual(["paid@x.com"]);
  });

  it("post_performance ordena por open_rate", () => {
    const r = q.getPostPerformance(db, "open_rate", 10) as any[];
    expect(r.map((x) => x.title)).toEqual(["B", "A"]);
  });

  it("growth agrupa por mes y por fuente", () => {
    const m = q.getGrowth(db, undefined, undefined, "month") as any;
    expect(m.growth_sources.map((x: any) => x.bucket)).toEqual(["2026-06", "2026-07"]);
    const s = q.getGrowth(db, undefined, undefined, "source") as any;
    expect(s.growth_sources[0].bucket).toBe("substack.com");
  });

  it("churn detecta baja, upgrade y downgrade", () => {
    const c = q.getChurn(db) as any;
    expect(c.summary).toEqual({ churned: 1, upgrades: 1, downgrades: 1 });
    expect(c.churned[0].email).toBe("gone@x.com");
  });

  it("query_sql permite funciones escalares y busquedas de texto con palabras clave", () => {
    // `replace()` y `char()` son funciones de SQLite, no escritura.
    expect(q.querySql(db, "SELECT replace('a-b', '-', ' ') AS r").rows).toEqual([{ r: "a b" }]);
    // Una palabra vetada dentro de un literal no debe bloquear la consulta.
    expect(q.querySql(db, "SELECT COUNT(*) AS n FROM subscribers WHERE email LIKE '%update%'").rows).toEqual([{ n: 0 }]);
    expect(q.querySql(db, "SELECT ';' AS s").rows).toEqual([{ s: ";" }]);
    // Pero la sentencia sigue vetada fuera de literales.
    expect(() => q.querySql(db, "SELECT 1 FROM subscribers UNION SELECT 1; DROP TABLE posts")).toThrow();
    expect(() => q.querySql(db, "WITH x AS (SELECT 1) REPLACE INTO subscribers VALUES (1)")).toThrow(/escritura/);
    expect(() => q.querySql(db, "SELECT load_extension('evil')")).toThrow(/escritura/);
  });

  it("query_sql solo lectura", () => {
    expect(q.querySql(db, "SELECT COUNT(*) AS n FROM subscribers").rows).toEqual([{ n: 4 }]);
    expect(q.querySql(db, "select email from subscribers").truncated_at).toBe(200);
    expect(() => q.querySql(db, "DELETE FROM subscribers")).toThrow(/SELECT/);
    expect(() => q.querySql(db, "SELECT 1; DROP TABLE subscribers")).toThrow();
    expect(() => q.querySql(db, "WITH x AS (SELECT 1) SELECT * FROM x; PRAGMA foo")).toThrow();
    expect(q.getSchema(db).tables.find((t) => t.name === "subscribers")!.rows).toBe(4);
  });
});
