import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, startRun } from "../src/db/index.js";
import { loadDirectory } from "../src/load/index.js";
import { loadNotes } from "../src/load/notes.js";
import { collectNotes, compactNoteStats, esRestack, type NoteRecord, type NotesBundle } from "../src/ingest/notes.js";
import { SubstackClient } from "../src/ingest/substack.js";
import * as q from "../src/queries.js";

const ME = 43892226;
const ana = { id: 1, name: "Ana Pérez", handle: "ana", photo_url: null, primary_publication: { subdomain: "anapost", name: "Ana Post" }, is_following: true, is_subscribed: false };
const bob = { id: 2, name: "Bob", handle: "bob", photo_url: null, primary_publication: null, is_following: false, is_subscribed: false };

/** substack.com falso: feed de 2 páginas con una nota ajena y un post que deben descartarse. */
function fakeNotesApi() {
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
  const fetchImpl: typeof fetch = async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const u = new URL(url);
    const p = u.pathname;
    if (p === "/api/v1/user/profile/self") return json({ id: ME, name: "Damian", handle: "sotoplatero" });
    if (p === `/api/v1/reader/feed/profile/${ME}`) {
      if (!u.searchParams.get("cursor"))
        return json({
          items: [
            { type: "post", post: { id: 9 } },
            { type: "comment", comment: { id: 100, user_id: ME, date: "2026-09-08T10:00:00.000Z", body: "Nota A", reaction_count: 2, restacks: 1, children_count: 1, attachments: [{ type: "post", post: { id: 5, title: "Post X", canonical_url: "https://x/p/x" } }] } },
            { type: "comment", comment: { id: 200, user_id: 777, date: "2026-09-07T10:00:00.000Z", body: "restack ajeno", reaction_count: 50, restacks: 0, children_count: 0 } },
          ],
          nextCursor: "c2",
        });
      return json({ items: [{ type: "comment", comment: { id: 101, user_id: ME, date: "2026-09-01T10:00:00.000Z", body: "Nota B", reaction_count: 0, restacks: 0, children_count: 0 } }], nextCursor: "" });
    }
    if (p === "/api/v1/comment/100/reactors") return json([ana, bob]);
    if (p === "/api/v1/comment/100/restackers") return json([ana, { id: ME, name: "Damian" }]);
    if (p === "/api/v1/reader/comment/100/replies")
      return json({ commentBranches: [{ comment: { id: 5001, user_id: 1, name: "Ana Pérez", date: "2026-09-08T11:00:00.000Z", body: "¡Grande!", reaction_count: 1, user_primary_publication: { subdomain: "anapost", name: "Ana Post" } }, descendantComments: [{ type: "comment", comment: { id: 5002, user_id: ME, name: "Damian", body: "gracias" } }, { type: "comment", comment: { id: 5003, user_id: 2, name: "Bob", body: "+1", date: "2026-09-08T12:00:00.000Z" } }] }], nextCursor: "" });
    if (p.startsWith("/api/v1/note_stats/")) return json({ error: "" });
    return json({ error: "nf" }, 404);
  };
  return fetchImpl;
}

describe("collectNotes", () => {
  it("pagina el feed, descarta posts y notas ajenas, y recoge likes/restacks/respuestas sin incluirte a ti", async () => {
    const client = new SubstackClient("x", "substack.sid=s", () => {}, fakeNotesApi(), { retryBaseMs: 1, pollMs: 1, pauseMs: 0 });
    const b = await collectNotes(client, { concurrency: 2 });
    expect(b.user_id).toBe(ME);
    expect(b.notes.map((n) => n.id)).toEqual([100, 101]);
    const a = b.notes[0];
    expect(a.reactors.map((r) => r.name)).toEqual(["Ana Pérez", "Bob"]);
    expect(a.restackers.map((r) => r.id)).toEqual([1]);
    expect(a.replies.map((r) => r.actor.name)).toEqual(["Ana Pérez", "Bob"]);
    expect(a.replies[0].actor.publication_subdomain).toBe("anapost");
    expect(a.attachments[0]).toMatchObject({ type: "post", post_id: 5, post_title: "Post X" });
    expect(a.stats).toBeNull();
    expect(b.errors).toEqual([]);
  });
});

describe("bundle stackchat-files (vía navegador)", () => {
  it("materializa los CSV que trae dentro y los carga como si fueran archivos sueltos", () => {
    const dir = mkdtempSync(join(tmpdir(), "stackchat-bundle-"));
    writeFileSync(
      join(dir, "stackchat-publication.json"),
      JSON.stringify({
        kind: "stackchat-files",
        fetched_at: "2026-09-11T00:00:00.000Z",
        files: {
          "email_list.csv": "Email,Name,Type,Start date,Cancel date\nana@x.com,Ana,Free,2026-06-01,\n",
          "traffic.csv": "Date,Views\n2026/06/11,7\n",
          "no-es-csv.txt": "se ignora",
        },
      }),
    );
    const db = openDb(":memory:");
    const rep = loadDirectory(db, dir);
    expect(rep.status).toBe("ok");
    // El contenedor no aparece como fila propia: se reportan sus CSV uno a uno.
    expect(rep.files.map((f) => f.kind).sort()).toEqual(["email_list", "traffic", "unknown"]);
    expect(db.prepare("SELECT email FROM subscribers").get()).toEqual({ email: "ana@x.com" });
    expect(db.prepare("SELECT date, views FROM traffic").get()).toEqual({ date: "2026-06-11", views: 7 });
    // Queda registrado de qué archivo salió cada cosa.
    expect(db.prepare("SELECT kind FROM raw_files WHERE kind = 'stackchat-files'").get()).toEqual({ kind: "stackchat-files" });
  });

  it("acepta el nombre anterior al renombrado, para bundles ya generados", () => {
    const dir = mkdtempSync(join(tmpdir(), "stackchat-legacy-"));
    writeFileSync(
      join(dir, "viejo.json"),
      JSON.stringify({ kind: "chatstack-files", files: { "traffic.csv": "Date,Views\n2026/06/11,3\n" } }),
    );
    const db = openDb(":memory:");
    expect(loadDirectory(db, dir).status).toBe("ok");
    expect(db.prepare("SELECT views FROM traffic").get()).toEqual({ views: 3 });
  });

  it("un JSON con kind desconocido no rompe la carga", () => {
    const dir = mkdtempSync(join(tmpdir(), "stackchat-bundle-"));
    writeFileSync(join(dir, "otra-cosa.json"), JSON.stringify({ kind: "vete-a-saber" }));
    writeFileSync(join(dir, "traffic.csv"), "Date,Views\n2026/06/11,7\n");
    const db = openDb(":memory:");
    const rep = loadDirectory(db, dir);
    // Un archivo de más se reporta, pero no degrada el run: lo reconocido se carga igual.
    expect(rep.status).toBe("ok");
    expect(rep.files.find((f) => f.path.endsWith("otra-cosa.json"))!.error).toMatch(/kind/);
    expect(db.prepare("SELECT COUNT(*) c FROM traffic").get()).toEqual({ c: 1 });
  });
});

describe("un restack no es una nota tuya", () => {
  const nota = (id: number, ctx: string | null, userId = ME) => ({
    type: "comment",
    context: ctx ? { type: ctx } : undefined,
    comment: { id, user_id: userId, date: "2026-09-01T00:00:00.000Z", body: "x", reaction_count: 0, restacks: 0, children_count: 0 },
  });

  function feedCon(items: unknown[]): typeof fetch {
    return (async (input: RequestInfo | URL) => {
      const p = new URL(typeof input === "string" ? input : (input as Request).url).pathname;
      const body = p === "/api/v1/user/profile/self" ? { id: ME } : { items, nextCursor: "" };
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
  }

  const cliente = (f: typeof fetch) => new SubstackClient("x", "substack.sid=s", () => {}, f, { retryBaseMs: 1, pollMs: 1, pauseMs: 0 });

  it("descarta el restack aunque venga firmado con tu id", async () => {
    // El caso que hoy se colaría: hasta ahora solo se miraba el autor, y Substack firma los
    // restacks con el autor original únicamente porque le da la gana, no porque lo prometa.
    const b = await collectNotes(cliente(feedCon([
      nota(1, "note"),
      nota(2, "comment_restack"),
      nota(3, "post_restack"),
    ])), {});
    expect(b.notes.map((n) => n.id)).toEqual([1]);
  });

  it("sin campo de contexto se comporta como antes, en vez de quedarse sin notas", () => {
    // Si Substack deja de mandar el contexto, la regla estricta borraría el archivo entero en
    // silencio. Esta falla hacia el lado seguro.
    expect(esRestack({ type: "comment" })).toBe(false);
    expect(esRestack({ type: "comment", context: {} })).toBe(false);
    expect(esRestack({ type: "comment", context: { type: "note" } })).toBe(false);
    expect(esRestack({ type: "comment", context: { type: "comment_restack" } })).toBe(true);
    // También si lo renombran con otra forma que siga diciendo restack.
    expect(esRestack({ type: "comment", context: { type: "noteRestackV2" } })).toBe(true);
    expect(esRestack({ type: "comment", contextType: "post_restack" })).toBe(true);
  });
});

describe("compactNoteStats", () => {
  it("se queda con las cifras de las tarjetas y descarta el resto", () => {
    const crudo = {
      cards: [
        { cardId: "impressions", headers: [{ title: "Impressions", value: 9 }], items: [] },
        { cardId: "audience", items: [{ title: "Subscribers", value: 3 }, { title: "Followers", value: 1 }] },
        { cardId: "vacia", items: [{ value: 5 }] },
      ],
      series: [1, 2, 3],
    };
    expect(compactNoteStats(crudo)).toEqual({
      impressions: { Impressions: 9 },
      audience: { Subscribers: 3, Followers: 1 },
    });
  });

  it("devuelve null cuando no hay nada que guardar", () => {
    expect(compactNoteStats(null)).toBeNull();
    expect(compactNoteStats({ error: "" })).toBeNull();
    expect(compactNoteStats({ cards: [] })).toBeNull();
  });
});

describe("una petición fallida no borra lo que ya estaba", () => {
  const nota = (extra: Partial<NoteRecord> = {}): NoteRecord => ({
    id: 100,
    user_id: 1,
    date: "2026-09-01T00:00:00.000Z",
    body: "x",
    reaction_count: 2,
    restacks: 0,
    children_count: 0,
    attachments: [],
    reactors: [
      { id: 7, name: "Ana", handle: "ana", photo_url: null, publication_subdomain: null, publication_name: null, is_subscribed: null, is_following: null, bestseller_tier: null },
      { id: 8, name: "Bob", handle: "bob", photo_url: null, publication_subdomain: null, publication_name: null, is_subscribed: null, is_following: null, bestseller_tier: null },
    ],
    restackers: [],
    replies: [],
    stats: null,
    ...extra,
  });
  const bundle = (n: NoteRecord): NotesBundle => ({
    kind: "notes",
    fetched_at: "2026-09-13T00:00:00.000Z",
    user_id: 1,
    notes: [n],
    errors: [],
  });

  it("conserva los likes y no da la nota por actualizada", () => {
    const db = openDb(":memory:");
    const run1 = startRun(db, null);
    loadNotes(db, run1, bundle(nota()));
    expect(db.prepare("SELECT COUNT(*) c FROM note_interactions WHERE kind = 'like'").get()).toEqual({ c: 2 });

    // Segundo sync: la petición de likes falla, así que llegan cero reactores y un contador nuevo.
    const run2 = startRun(db, null);
    loadNotes(db, run2, bundle(nota({ reaction_count: 5, reactors: [], failed: ["reactors"] })));

    // Los likes anteriores siguen ahí…
    expect(db.prepare("SELECT COUNT(*) c FROM note_interactions WHERE kind = 'like'").get()).toEqual({ c: 2 });
    // …y el contador no se ha pisado, para que el incremental vuelva a intentarlo.
    expect(db.prepare("SELECT reaction_count FROM notes WHERE note_id = 100").get()).toEqual({ reaction_count: 2 });
  });

  it("si la petición va bien, quien quitó el like desaparece", () => {
    const db = openDb(":memory:");
    loadNotes(db, startRun(db, null), bundle(nota()));
    const solaAna = nota({
      reaction_count: 1,
      reactors: [{ id: 7, name: "Ana", handle: "ana", photo_url: null, publication_subdomain: null, publication_name: null, is_subscribed: null, is_following: null, bestseller_tier: null }],
    });
    loadNotes(db, startRun(db, null), bundle(solaAna));
    expect(db.prepare("SELECT COUNT(*) c FROM note_interactions WHERE kind = 'like'").get()).toEqual({ c: 1 });
    expect(db.prepare("SELECT reaction_count FROM notes WHERE note_id = 100").get()).toEqual({ reaction_count: 1 });
  });
});

describe("loadNotes + queries", () => {
  it("carga el bundle, es idempotente y responde quién interactúa más", async () => {
    const client = new SubstackClient("x", "substack.sid=s", () => {}, fakeNotesApi(), { retryBaseMs: 1, pollMs: 1, pauseMs: 0 });
    const bundle: NotesBundle = await collectNotes(client);
    const dir = mkdtempSync(join(tmpdir(), "stackchat-notes-"));
    writeFileSync(join(dir, "notes.json"), JSON.stringify(bundle));
    writeFileSync(
      join(dir, "email_list.csv"),
      "Email,Name,Type,Start date,Cancel date\nana@x.com,Ana Pérez,Free,2026-06-01,\n",
    );
    const db = openDb(":memory:");
    const rep = loadDirectory(db, dir);
    expect(rep.status).toBe("ok");
    expect(rep.files.find((f) => f.kind === "notes")!.rows).toBe(2);
    loadDirectory(db, dir);
    expect(db.prepare("SELECT COUNT(*) c FROM notes").get()).toEqual({ c: 2 });
    expect(db.prepare("SELECT COUNT(*) c FROM note_interactions").get()).toEqual({ c: 5 });
    expect(db.prepare("SELECT COUNT(*) c FROM note_actors").get()).toEqual({ c: 2 });

    const eng = q.getNoteEngagers(db) as any[];
    expect(eng[0]).toMatchObject({ name: "Ana Pérez", interactions: 3, likes: 1, restacks: 1, replies: 1, notes_touched: 1, matched_subscriber_email: "ana@x.com" });
    expect(eng[1]).toMatchObject({ name: "Bob", interactions: 2, likes: 1, replies: 1, matched_subscriber_email: null });
    expect((q.getNoteEngagers(db, 10, "reply") as any[]).map((e) => e.name)).toEqual(["Ana Pérez", "Bob"]);

    const perf = q.getNotesPerformance(db) as any[];
    expect(perf[0]).toMatchObject({ note_id: 100, likes: 2, restacks: 1, replies: 1, interactions: 4, unique_people: 2, has_stats: 0 });
    // `replies` sale del contador del feed (children_count=1); las respuestas cargadas son 2 porque incluyen hilos.
    expect(perf[0].url).toBe("https://substack.com/@sotoplatero/note/c-100".replace("sotoplatero", "")); // sin actor propio en la tabla, handle vacío
    const note = q.getNote(db, 100) as any;
    expect(note.interactions).toHaveLength(5);
    expect(note.interactions.find((i: any) => i.kind === "reply").body).toBe("¡Grande!");
    expect(q.getNote(db, 999)).toBeNull();
  });
});
