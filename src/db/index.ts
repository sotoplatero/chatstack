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
  return db;
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
