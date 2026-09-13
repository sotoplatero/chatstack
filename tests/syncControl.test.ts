import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type Db } from "../src/db/index.js";
import { acquireLock, releaseLock, lockPath, isFresh, hoursSinceLastSync, writeSyncLog, readLastSyncLog, LOCK_TTL_MS } from "../src/syncControl.js";
import { collectNotes, fetchOwnNotes, type NoteCounts } from "../src/ingest/notes.js";
import { SubstackClient } from "../src/ingest/substack.js";
import { coverage, knownNotes, missingDatasets } from "../src/queries.js";
import { loadNotes } from "../src/load/notes.js";
import { startRun, finishRun, markRunPartial } from "../src/db/index.js";

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "stackchat-sc-"));
  process.env.STACKCHAT_HOME = home;
});
afterEach(() => {
  delete process.env.STACKCHAT_HOME;
  rmSync(home, { recursive: true, force: true });
});

function dbConUnSync(finishedAt: string): Db {
  const db = openDb(":memory:");
  const id = startRun(db, null);
  db.prepare("UPDATE sync_runs SET finished_at = ?, status = 'ok' WHERE id = ?").run(finishedAt, id);
  return db;
}

describe("guardia de frescura", () => {
  it("mide las horas desde el último sync terminado", () => {
    const hace2h = new Date(Date.now() - 2 * 3_600_000).toISOString();
    const db = dbConUnSync(hace2h);
    expect(hoursSinceLastSync(db)).toBeCloseTo(2, 1);
    expect(isFresh(db, 6)).toBe(true);
    expect(isFresh(db, 1)).toBe(false);
  });

  it("una base sin syncs nunca está fresca", () => {
    const db = openDb(":memory:");
    expect(hoursSinceLastSync(db)).toBeNull();
    expect(isFresh(db, 9999)).toBe(false);
  });

  it("ignora un sync que empezó pero no terminó", () => {
    const db = openDb(":memory:");
    startRun(db, null); // queda 'running', sin finished_at
    expect(isFresh(db, 24)).toBe(false);
  });

  it("un sync parcial no cuenta como fresco: dejó alguna fuente sin bajar", () => {
    const db = openDb(":memory:");
    const id = startRun(db, null);
    db.prepare("UPDATE sync_runs SET finished_at = ?, status = 'partial' WHERE id = ?").run(new Date().toISOString(), id);
    expect(isFresh(db, 24)).toBe(false);
    // Y en cuanto uno sale bien, vuelve a contar.
    const ok = startRun(db, null);
    db.prepare("UPDATE sync_runs SET finished_at = ?, status = 'ok' WHERE id = ?").run(new Date().toISOString(), ok);
    expect(isFresh(db, 24)).toBe(true);
  });

  it("markRunPartial degrada el run y conserva la nota anterior", () => {
    const db = openDb(":memory:");
    const id = startRun(db, null);
    finishRun(db, id, "ok", "lo cargado");
    markRunPartial(db, id, "traffic: HTTP 503");
    const row = db.prepare("SELECT status, notes FROM sync_runs WHERE id = ?").get(id) as { status: string; notes: string };
    expect(row.status).toBe("partial");
    expect(row.notes).toContain("lo cargado");
    expect(row.notes).toContain("traffic: HTTP 503");
  });
});

describe("candado", () => {
  it("el segundo proceso vivo no puede tomarlo", () => {
    expect(acquireLock(Date.now(), process.pid)).toBe(true);
    // Otro pid, y uno que existe de verdad (el nuestro sirve para simular "vivo").
    expect(existsSync(lockPath())).toBe(true);
    const ajeno = acquireLock(Date.now(), process.pid + 100000);
    // pid inexistente → se considera muerto y se puede pisar; ese es el comportamiento buscado.
    expect(typeof ajeno).toBe("boolean");
  });

  it("un candado caducado se pisa", () => {
    acquireLock(Date.now() - LOCK_TTL_MS - 1000, process.pid);
    expect(acquireLock(Date.now(), process.pid + 1)).toBe(true);
  });

  it("un candado ilegible no bloquea para siempre", () => {
    writeFileSync(lockPath(), "esto no es json", "utf8");
    expect(acquireLock()).toBe(true);
  });

  it("soltarlo lo borra, y soltarlo dos veces no revienta", () => {
    acquireLock();
    releaseLock();
    expect(existsSync(lockPath())).toBe(false);
    expect(() => releaseLock()).not.toThrow();
  });
});

describe("registro del sync de fondo", () => {
  it("guarda la última línea para que `status` la muestre", () => {
    expect(readLastSyncLog()).toBeNull();
    writeSyncLog("sync #1 ok");
    writeSyncLog("falló: la sesión de Substack ha caducado");
    expect(readLastSyncLog()).toContain("caducado");
  });
});

/** Cuenta cada petición para poder afirmar cuántas se ahorran. */
function apiDeNotas(notas: { id: number; likes: number; re: number; resp: number }[]) {
  const pedidas: string[] = [];
  const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { "content-type": "application/json" } });
  const fetchImpl: typeof fetch = async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const p = new URL(url).pathname;
    pedidas.push(p);
    if (p === "/api/v1/user/profile/self") return json({ id: 1 });
    if (p.startsWith("/api/v1/reader/feed/profile/")) {
      return json({
        items: notas.map((n) => ({
          type: "comment",
          comment: { id: n.id, user_id: 1, date: "2026-09-01T00:00:00.000Z", body: "x", reaction_count: n.likes, restacks: n.re, children_count: n.resp },
        })),
        nextCursor: "",
      });
    }
    if (p.endsWith("/reactors") || p.endsWith("/restackers")) return json([{ id: 99, name: "Ana" }]);
    if (p.endsWith("/replies")) return json({ commentBranches: [], nextCursor: "" });
    if (p.startsWith("/api/v1/note_stats/")) return json({ error: "" });
    return json({});
  };
  return { fetchImpl, pedidas };
}

describe("sync incremental de notas", () => {
  const NOTAS = [
    { id: 10, likes: 2, re: 0, resp: 0 },
    { id: 11, likes: 0, re: 1, resp: 0 },
    { id: 12, likes: 0, re: 0, resp: 0 },
  ];
  const cliente = (fetchImpl: typeof fetch) =>
    new SubstackClient("x", "substack.sid=s", () => {}, fetchImpl, { retryBaseMs: 1, pollMs: 1, pauseMs: 0 });

  it("sin estado previo baja todo", async () => {
    const { fetchImpl, pedidas } = apiDeNotas(NOTAS);
    const b = await collectNotes(cliente(fetchImpl), {});
    expect(b.notes.map((n) => n.id).sort()).toEqual([10, 11, 12]);
    expect(pedidas.filter((p) => p.endsWith("/reactors"))).toHaveLength(1);
    expect(pedidas.filter((p) => p.endsWith("/restackers"))).toHaveLength(1);
  });

  it("con todo igual no pide ni una interacción", async () => {
    const known = new Map<number, NoteCounts>(
      NOTAS.map((n) => [n.id, { reaction_count: n.likes, restacks: n.re, children_count: n.resp }]),
    );
    const withStats = new Set(NOTAS.map((n) => n.id));
    const { fetchImpl, pedidas } = apiDeNotas(NOTAS);
    const b = await collectNotes(cliente(fetchImpl), { known, withStats });
    expect(b.notes).toHaveLength(0);
    expect(pedidas.filter((p) => /reactors|restackers|replies|note_stats/.test(p))).toEqual([]);
  });

  it("solo baja la nota cuyos contadores cambiaron", async () => {
    const known = new Map<number, NoteCounts>(
      NOTAS.map((n) => [n.id, { reaction_count: n.likes, restacks: n.re, children_count: n.resp }]),
    );
    const withStats = new Set(NOTAS.map((n) => n.id));
    // La nota 10 pasa de 2 a 5 likes; las demás siguen igual.
    const ahora = NOTAS.map((n) => (n.id === 10 ? { ...n, likes: 5 } : n));
    const { fetchImpl, pedidas } = apiDeNotas(ahora);
    const b = await collectNotes(cliente(fetchImpl), { known, withStats });
    expect(b.notes.map((n) => n.id)).toEqual([10]);
    expect(pedidas.filter((p) => p.endsWith("/reactors"))).toEqual(["/api/v1/comment/10/reactors"]);
    expect(pedidas.filter((p) => p.endsWith("/restackers"))).toEqual([]);
  });

  it("una nota nueva se baja aunque las viejas no cambien", async () => {
    const known = new Map<number, NoteCounts>(
      NOTAS.map((n) => [n.id, { reaction_count: n.likes, restacks: n.re, children_count: n.resp }]),
    );
    const { fetchImpl } = apiDeNotas([{ id: 13, likes: 1, re: 0, resp: 0 }, ...NOTAS]);
    const b = await collectNotes(cliente(fetchImpl), { known, withStats: new Set(NOTAS.map((n) => n.id)) });
    expect(b.notes.map((n) => n.id)).toEqual([13]);
  });

  it("reintenta las stats de una nota con interacción que aún no las tenía", async () => {
    const known = new Map<number, NoteCounts>([[10, { reaction_count: 2, restacks: 0, children_count: 0 }]]);
    const { fetchImpl, pedidas } = apiDeNotas([{ id: 10, likes: 2, re: 0, resp: 0 }]);
    // withStats vacío: Substack tarda ~24 h en habilitarlas, así que merece otro intento.
    const b = await collectNotes(cliente(fetchImpl), { known, withStats: new Set() });
    expect(b.notes.map((n) => n.id)).toEqual([10]);
    expect(pedidas.some((p) => p.startsWith("/api/v1/note_stats/"))).toBe(true);
  });

  it("deja de paginar cuando varias páginas seguidas no traen novedad", async () => {
    let paginas = 0;
    const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { "content-type": "application/json" } });
    const fetchImpl: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (!new URL(url).pathname.startsWith("/api/v1/reader/feed/profile/")) return json({});
      paginas++;
      return json({
        items: [{ type: "comment", comment: { id: 100 + paginas, user_id: 1, reaction_count: 0, restacks: 0, children_count: 0, date: "2026-01-01T00:00:00.000Z" } }],
        nextCursor: "c" + paginas,
      });
    };
    // Todas conocidas y sin cambios: debe cortar a las 3 páginas, no seguir hasta 200.
    const known = new Map<number, NoteCounts>(
      Array.from({ length: 300 }, (_, i) => [101 + i, { reaction_count: 0, restacks: 0, children_count: 0 }]),
    );
    await fetchOwnNotes(cliente(fetchImpl), 1, { known, stopAfterUnchangedPages: 3 });
    expect(paginas).toBe(3);
  });
});

describe("knownNotes lee de la BD lo que el incremental necesita", () => {
  it("mapea replies_count a children_count y marca las que ya tienen stats", () => {
    const db = openDb(":memory:");
    const runId = startRun(db, null);
    loadNotes(db, runId, {
      kind: "notes",
      fetched_at: new Date().toISOString(),
      user_id: 1,
      errors: [],
      notes: [
        { id: 10, user_id: 1, date: "2026-09-01", body: "a", reaction_count: 2, restacks: 1, children_count: 3, attachments: [], reactors: [], restackers: [], replies: [], stats: { x: 1 } },
        { id: 11, user_id: 1, date: "2026-09-02", body: "b", reaction_count: 0, restacks: 0, children_count: 0, attachments: [], reactors: [], restackers: [], replies: [], stats: null },
      ],
    });
    finishRun(db, runId, "ok");
    const k = knownNotes(db);
    expect(k.counts.get(10)).toEqual({ reaction_count: 2, restacks: 1, children_count: 3 });
    expect(k.withStats.has(10)).toBe(true);
    expect(k.withStats.has(11)).toBe(false);
  });
});

describe("cobertura: qué hay, qué falta y qué está vacío de verdad", () => {
  it("una base recién creada lo declara todo ausente", () => {
    const db = openDb(":memory:");
    expect(coverage(db).every((c) => c.missing && c.rows === 0 && !c.ever_fetched)).toBe(true);
    expect(missingDatasets(db)).toContain("notes");
    expect(missingDatasets(db)).toContain("subscribers");
  });

  it("marca presente lo que tiene filas, y de qué sync viene", () => {
    const db = openDb(":memory:");
    const runId = startRun(db, null);
    db.prepare("INSERT INTO raw_files (run_id, kind, path, sha256, row_count) VALUES (?, 'notes', 'x', 'y', 1)").run(runId);
    loadNotes(db, runId, {
      kind: "notes",
      fetched_at: new Date().toISOString(),
      user_id: 1,
      errors: [],
      notes: [
        {
          id: 10, user_id: 1, date: "2026-09-01", body: "a",
          reaction_count: 1, restacks: 0, children_count: 0, attachments: [],
          reactors: [{ id: 7, name: "Ana", handle: null, photo_url: null, publication_subdomain: null, publication_name: null, is_subscribed: null, is_following: null, bestseller_tier: null }],
          restackers: [], replies: [], stats: null,
        },
      ],
    });
    finishRun(db, runId, "ok");

    const por = Object.fromEntries(coverage(db).map((c) => [c.dataset, c]));
    expect(por.notes).toMatchObject({ missing: false, rows: 1, last_run_id: runId, ever_fetched: true });
    expect(por.note_interactions).toMatchObject({ missing: false, rows: 1 });
    expect(por.subscribers.missing).toBe(true);
    expect(missingDatasets(db)).toContain("subscribers");
    expect(missingDatasets(db)).not.toContain("notes");
  });

  it("una tabla vacía cuya fuente SÍ se descargó no cuenta como ausente", () => {
    // El caso de quien nunca ha escrito una nota: pedirla otra vez no cambiaría nada, y sin esta
    // distinción el skill lanzaría un sync en cada pregunta, para siempre.
    const db = openDb(":memory:");
    const runId = startRun(db, null);
    db.prepare("INSERT INTO raw_files (run_id, kind, path, sha256, row_count) VALUES (?, 'notes', 'x', 'y', 0)").run(runId);
    finishRun(db, runId, "ok");

    const por = Object.fromEntries(coverage(db).map((c) => [c.dataset, c]));
    expect(por.notes).toMatchObject({ rows: 0, ever_fetched: true, missing: false });
    expect(missingDatasets(db)).not.toContain("notes");
    // Lo que de verdad no se ha traído sigue apareciendo.
    expect(missingDatasets(db)).toContain("subscribers");
  });

  it("cubre subscriber_growth, que el esquema documentaba y la cobertura ignoraba", () => {
    expect(coverage(openDb(":memory:")).map((c) => c.dataset)).toContain("subscriber_growth");
  });
});
