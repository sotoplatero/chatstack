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

/** Degrada un run ya cerrado a `partial`, conservando lo que ya se anotó. */
export function markRunPartial(db: Db, runId: number, extra: string) {
  const row = db.prepare("SELECT notes FROM sync_runs WHERE id = ?").get(runId) as { notes: string | null } | undefined;
  const notes = [row?.notes, `fuentes que no se pudieron descargar:\n${extra}`].filter(Boolean).join("\n");
  db.prepare("UPDATE sync_runs SET status = 'partial', notes = ? WHERE id = ?").run(notes, runId);
}
