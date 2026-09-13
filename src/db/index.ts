import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SCHEMA_SQL } from "./schema.js";

export type Db = DatabaseSync;

export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA_SQL);
  migrate(db);
  return db;
}

/**
 * `CREATE TABLE IF NOT EXISTS` no añade columnas a una tabla que ya existe, así que las bases
 * creadas por versiones anteriores necesitan un empujón. Añadir una columna nueva aquí es todo
 * lo que hace falta: SQLite la rellena con NULL y los cargadores la escriben en el siguiente sync.
 */
const ADDED_COLUMNS: Record<string, string[]> = {
  // Por qué falló un intento, como código estable y no como frase. El motivo vivía solo en un
  // archivo de texto, así que para saber si la sesión había caducado había que buscar una palabra
  // dentro de una oración: cambiarle la redacción rompía la detección sin que nada avisara.
  sync_runs: ["failure TEXT"],
  posts: ["wordcount INTEGER", "last_synced_run_id INTEGER"],
  post_email_stats: [
    "sent INTEGER", "delivered INTEGER", "opens INTEGER", "opened INTEGER", "clicks INTEGER",
    "clicked INTEGER", "click_rate REAL", "likes INTEGER", "comments INTEGER", "shares INTEGER",
    "restacks INTEGER", "unsubscribes INTEGER", "finished_post INTEGER",
  ],
};

function migrate(db: Db) {
  for (const [table, columns] of Object.entries(ADDED_COLUMNS)) {
    const have = new Set(tableColumns(db, table));
    for (const decl of columns) {
      const name = decl.split(" ")[0];
      if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${decl}`);
    }
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function startRun(db: Db, rawDir: string | null): number {
  const r = db
    .prepare("INSERT INTO sync_runs (started_at, status, raw_dir) VALUES (?, 'running', ?)")
    .run(nowIso(), rawDir);
  return Number(r.lastInsertRowid);
}

export function finishRun(db: Db, runId: number, status: "ok" | "partial" | "failed", notes?: string) {
  db.prepare("UPDATE sync_runs SET finished_at = ?, status = ?, notes = ? WHERE id = ?").run(
    nowIso(),
    status,
    notes ?? null,
    runId,
  );
}

export function tableColumns(db: Db, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
}

/**
 * Motivos de fallo de un sync, como códigos cerrados. `session_expired` es el único que no se
 * arregla reintentando: hace falta un cURL nuevo.
 */
export type SyncFailure = "session_expired" | "nothing_downloaded" | "partial_sources";

/** Deja constancia en la base de un intento que ni siquiera llegó a cargar nada. */
export function recordFailedRun(db: Db, failure: SyncFailure, notes: string): number {
  const id = startRun(db, null);
  db.prepare("UPDATE sync_runs SET finished_at = ?, status = 'failed', failure = ?, notes = ? WHERE id = ?").run(
    nowIso(),
    failure,
    notes,
    id,
  );
  return id;
}

/** El último intento, sea cual sea su resultado. De aquí sale el estado, no de un archivo suelto. */
export function lastRun(db: Db): { id: number; finished_at: string | null; status: string; failure: string | null } | null {
  return (
    (db
      .prepare("SELECT id, finished_at, status, failure FROM sync_runs WHERE status <> 'running' ORDER BY id DESC LIMIT 1")
      .get() as { id: number; finished_at: string | null; status: string; failure: string | null } | undefined) ?? null
  );
}

/** Degrada un run ya cerrado a `partial`, conservando lo que ya se anotó. */
export function markRunPartial(db: Db, runId: number, extra: string) {
  const row = db.prepare("SELECT notes FROM sync_runs WHERE id = ?").get(runId) as { notes: string | null } | undefined;
  const notes = [row?.notes, `fuentes que no se pudieron descargar:\n${extra}`].filter(Boolean).join("\n");
  db.prepare("UPDATE sync_runs SET status = 'partial', failure = 'partial_sources', notes = ? WHERE id = ?").run(notes, runId);
}
