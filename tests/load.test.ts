import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type Db } from "../src/db/index.js";
import { detectKind, normDate } from "../src/load/csv.js";
import { loadDirectory } from "../src/load/index.js";
import { normalizeSubscriberRow } from "../src/load/subscriberRow.js";

const EMAIL_LIST_V1 = `email,active_subscription,expiry,plan,email_disabled,created_at,first_payment_at
a@x.com,false,,other,false,2026-07-01T00:00:00.000Z,
b@x.com,true,2027-07-01T00:00:00.000Z,yearly,false,2026-06-01T00:00:00.000Z,2026-07-15T00:00:00.000Z
c@x.com,false,,other,true,2026-05-01T00:00:00.000Z,
`;
// a@x.com pasa a pago, c@x.com desaparece (baja), d@x.com es nuevo.
const EMAIL_LIST_V2 = `email,active_subscription,expiry,plan,email_disabled,created_at,first_payment_at
a@x.com,true,,monthly,false,2026-07-01T00:00:00.000Z,2026-08-01T00:00:00.000Z
b@x.com,true,2027-07-01T00:00:00.000Z,yearly,false,2026-06-01T00:00:00.000Z,2026-07-15T00:00:00.000Z
d@x.com,false,,other,false,2026-08-20T00:00:00.000Z,
`;
const POSTS = `post_id,post_date,is_published,email_sent_at,inbox_sent_at,type,audience,title,subtitle,podcast_url
111.first-post,2026-07-18T04:27:59.900Z,true,2026-07-18T04:27:59.330Z,2026-07-18T04:27:59.330Z,newsletter,everyone,Primer post,Sub 1,
222.second-post,2026-07-11T04:01:38.043Z,true,2026-07-11T04:01:38.979Z,2026-07-11T04:01:38.979Z,newsletter,only_paid,Segundo post,Sub 2,
333.draft,2026-07-20T00:00:00.000Z,false,,,newsletter,everyone,Borrador,,
`;
const EMAIL_STATS = `title,post_date,audience,views,engagement_rate,signups,subscribes,estimated_value,open_rate
Primer post,2026-07-18T04:27:59.900Z,everyone,35,0.25,2,1,0,0.307692
Segundo post,2026-07-11T04:01:38.043Z,everyone,24,0.375,0,0,0,0.888889
Post borrado,2026-01-01T00:00:00.000Z,everyone,5,0.1,0,0,0,0.5
`;
const GROWTH = `Date,Source,Category,Unique visitors,New subscribers,New revenue
2026/06/09,Direct,Other,1,0,0
2026/06/10,substack.com,Substack,10,3,0
`;
const TRAFFIC = `Date,Views
2026/06/11,2
2026/06/12,20
`;
const FREE_GROWTH = `date,new_free,unsubscribes
2026/08/22,3,1
`;
const PAID_GROWTH = `date,new_paid,upgrades,trials_started,cancellations_initiated,cancellations_finalized
2026/08/22,1,1,0,0,0
`;

function fixtureDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "stackchat-fix-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content, "utf8");
  return dir;
}

describe("detectKind", () => {
  it("identifica cada export de Substack por cabeceras", () => {
    expect(detectKind("email,active_subscription,expiry,plan,email_disabled,created_at,first_payment_at".split(","))).toBe("email_list");
    expect(detectKind("title,post_date,audience,views,engagement_rate,signups,subscribes,estimated_value,open_rate".split(","))).toBe("email_stats");
    expect(detectKind("Date,Source,Category,Unique visitors,New subscribers,New revenue".split(","))).toBe("growth_sources");
    expect(detectKind(["Date", "Views"])).toBe("traffic");
    expect(detectKind("post_id,post_date,is_published,email_sent_at,inbox_sent_at,type,audience,title,subtitle,podcast_url".split(","))).toBe("posts");
    expect(detectKind(["date", "new_free", "unsubscribes"])).toBe("free_subscriber_growth");
    expect(detectKind(["date", "new_paid", "upgrades"])).toBe("paid_subscriber_growth");
    expect(detectKind(["Email", "Name", "Stripe plan", "Cancel date", "Start date", "Activity", "Type"])).toBe("email_list");
    expect(detectKind(["date", "total_subscribers"])).toBe("subscriber_totals");
    expect(detectKind(["foo", "bar"])).toBe("unknown");
  });
});

describe("normDate / normalizePlan", () => {
  it("normaliza fechas con barras y deja ISO intacto", () => {
    expect(normDate("2026/06/09")).toBe("2026-06-09");
    expect(normDate("2026-07-18T04:27:59.900Z")).toBe("2026-07-18T04:27:59.900Z");
    expect(normDate("")).toBeNull();
  });
  it("mapea plan/activo (formato legado)", () => {
    const n = (r: Record<string, string>) => {
      const x = normalizeSubscriberRow({ email: "a@x.com", created_at: "2026-01-01", ...r })!;
      return { plan: x.plan, isActive: x.isActive };
    };
    expect(n({ active_subscription: "false", plan: "other", email_disabled: "false" })).toEqual({ plan: "free", isActive: 1 });
    expect(n({ active_subscription: "true", plan: "yearly", email_disabled: "false" })).toEqual({ plan: "yearly", isActive: 1 });
    expect(n({ active_subscription: "true", plan: "other", email_disabled: "true" })).toEqual({ plan: "paid", isActive: 0 });
  });
});

describe("suscriptores por la API del panel (sin descarga)", () => {
  // `POST /api/v1/subscriber-stats` devuelve la lista en JSON, sin CORS ni descarga, asi que la via
  // del navegador puede traerlos en cualquier maquina. El snippet los emite con las cabeceras del
  // export para que el cargador los reconozca sin cambios: esto fija ese contrato.
  const CABECERA = "Email,Name,Type,Stripe plan,Start date,Activity,Revenue";

  it("la forma que emite el snippet se detecta como email_list", () => {
    expect(detectKind(CABECERA.split(","))).toBe("email_list");
  });

  it("mapea los tres planes que devuelve la API", () => {
    const fila = (tipo: string, interval: string) =>
      normalizeSubscriberRow({
        Email: "A@Ejemplo.com", Name: "Ana", Type: tipo, "Stripe plan": interval,
        "Start date": "2026-05-01T10:00:00.000000000+00:00", Activity: "4", Revenue: "50",
      });
    // subscription_type llega null para los gratuitos y el snippet lo emite vacio.
    expect(fila("", "free")).toMatchObject({ plan: "free", isActive: 1, email: "a@ejemplo.com" });
    expect(fila("paid", "monthly")?.plan).toBe("monthly");
    // La API dice "annual"; la base guarda "yearly".
    expect(fila("paid", "annual")?.plan).toBe("yearly");
  });

  it("conserva nombre y activity_rating en extra, que es de donde salen los candidatos", () => {
    const r = normalizeSubscriberRow({
      Email: "b@ejemplo.com", Name: "Beto", Type: "", "Stripe plan": "free",
      "Start date": "2026-07-20T23:06:19.807341000+00:00", Activity: "5", Revenue: "0",
    });
    expect(r?.extra).toMatchObject({ name: "Beto", activity: 5 });
    expect(r?.createdAt?.slice(0, 10)).toBe("2026-07-20");
  });
});

describe("loadDirectory", () => {
  let db: Db;
  beforeEach(() => {
    db = openDb(":memory:");
  });

  it("carga los 7 tipos y une email_stats con posts", () => {
    const dir = fixtureDir({
      "email_list.csv": EMAIL_LIST_V1,
      "posts.csv": POSTS,
      "x_email_stats_2026.csv": EMAIL_STATS,
      "x_growth_sources.csv": GROWTH,
      "x_traffic.csv": TRAFFIC,
      "x_free_subscriber_growth.csv": FREE_GROWTH,
      "x_paid_subscriber_growth.csv": PAID_GROWTH,
    });
    const rep = loadDirectory(db, dir);
    expect(rep.status).toBe("ok");
    expect(rep.files.map((f) => f.kind).sort()).toEqual(
      ["email_list", "email_stats", "free_subscriber_growth", "growth_sources", "paid_subscriber_growth", "posts", "traffic"].sort(),
    );
    const subs = db.prepare("SELECT email, plan, is_active FROM subscribers ORDER BY email").all();
    expect(subs).toEqual([
      { email: "a@x.com", plan: "free", is_active: 1 },
      { email: "b@x.com", plan: "yearly", is_active: 1 },
      { email: "c@x.com", plan: "free", is_active: 0 },
    ]);
    const stats = db.prepare("SELECT post_id, title FROM post_email_stats ORDER BY post_id").all();
    expect(stats).toEqual([
      { post_id: "111.first-post", title: "Primer post" },
      { post_id: "222.second-post", title: "Segundo post" },
      { post_id: "title:Post borrado", title: "Post borrado" },
    ]);
    expect(db.prepare("SELECT COUNT(*) c FROM growth_sources").get()).toEqual({ c: 2 });
    expect(db.prepare("SELECT date, views FROM traffic ORDER BY date").all()).toEqual([
      { date: "2026-06-11", views: 2 },
      { date: "2026-06-12", views: 20 },
    ]);
    expect(db.prepare("SELECT new_free, unsubscribes, new_paid, upgrades FROM subscriber_growth_daily").get()).toEqual({
      new_free: 3,
      unsubscribes: 1,
      new_paid: 1,
      upgrades: 1,
    });
    expect(db.prepare("SELECT COUNT(*) c FROM raw_files").get()).toEqual({ c: 7 });
  });

  it("es idempotente: recargar el mismo directorio no duplica", () => {
    const dir = fixtureDir({ "email_list.csv": EMAIL_LIST_V1, "posts.csv": POSTS, "s.csv": EMAIL_STATS });
    loadDirectory(db, dir);
    loadDirectory(db, dir);
    expect(db.prepare("SELECT COUNT(*) c FROM subscribers").get()).toEqual({ c: 3 });
    expect(db.prepare("SELECT COUNT(*) c FROM posts").get()).toEqual({ c: 3 });
    expect(db.prepare("SELECT COUNT(*) c FROM subscriber_snapshots").get()).toEqual({ c: 6 });
  });

  it("deriva upgrades y bajas entre syncs", () => {
    loadDirectory(db, fixtureDir({ "email_list.csv": EMAIL_LIST_V1 }));
    loadDirectory(db, fixtureDir({ "email_list.csv": EMAIL_LIST_V2 }));
    const a = db.prepare("SELECT plan, plan_since, is_active FROM subscribers WHERE email = 'a@x.com'").get() as any;
    expect(a.plan).toBe("monthly");
    expect(a.plan_since).toBe("2026-08-01T00:00:00.000Z");
    const c = db.prepare("SELECT is_active, unsubscribed_at FROM subscribers WHERE email = 'c@x.com'").get() as any;
    expect(c.is_active).toBe(0);
    // c ya estaba inactivo (email_disabled) en v1, así que no cuenta como baja nueva.
    expect(c.unsubscribed_at).toBeNull();
    const b = db.prepare("SELECT plan_since FROM subscribers WHERE email = 'b@x.com'").get() as any;
    expect(b.plan_since).toBe("2026-07-15T00:00:00.000Z");
    expect(db.prepare("SELECT COUNT(*) c FROM subscribers WHERE email = 'd@x.com'").get()).toEqual({ c: 1 });
    const snaps = db.prepare("SELECT run_id, plan FROM subscriber_snapshots WHERE email = 'a@x.com' ORDER BY run_id").all();
    expect(snaps).toEqual([
      { run_id: 1, plan: "free" },
      { run_id: 2, plan: "monthly" },
    ]);
  });

  it("marca baja a quien estaba activo y desaparece", () => {
    loadDirectory(db, fixtureDir({ "email_list.csv": EMAIL_LIST_V2 }));
    loadDirectory(db, fixtureDir({ "email_list.csv": EMAIL_LIST_V1 }));
    const d = db.prepare("SELECT is_active, unsubscribed_at FROM subscribers WHERE email = 'd@x.com'").get() as any;
    expect(d.is_active).toBe(0);
    expect(d.unsubscribed_at).not.toBeNull();
    expect(db.prepare("SELECT plan FROM subscriber_snapshots WHERE email = 'd@x.com' AND run_id = 2").get()).toEqual({ plan: "churned" });
  });

  it("registra archivos desconocidos sin abortar", () => {
    const rep = loadDirectory(db, fixtureDir({ "email_list.csv": EMAIL_LIST_V1, "raro.csv": "foo,bar\n1,2\n" }));
    expect(rep.status).toBe("ok");
    const unknown = rep.files.find((f) => f.kind === "unknown")!;
    expect(unknown.error).toMatch(/no reconocidas/);
    expect(db.prepare("SELECT kind FROM raw_files WHERE kind = 'unknown'").get()).toEqual({ kind: "unknown" });
  });
});
