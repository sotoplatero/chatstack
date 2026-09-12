import { readdirSync, statSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname, basename } from "node:path";
import { tmpdir } from "node:os";
import AdmZip from "adm-zip";
import type { Db } from "../db/index.js";
import { startRun, finishRun } from "../db/index.js";
import { detectKind, readCsv, type CsvKind, type Row } from "./csv.js";
import {
  loadEmailList,
  loadEmailStats,
  loadGrowthSources,
  loadPosts,
  loadSubscriberGrowth,
  loadSubscriberTotals,
  loadTraffic,
  type LoadResult,
} from "./loaders.js";
import { loadNotes } from "./notes.js";
import type { NotesBundle } from "../ingest/notes.js";

export interface FileReport {
  path: string;
  kind: CsvKind;
  rows: number;
  result?: LoadResult;
  error?: string;
}

export interface RunReport {
  runId: number;
  status: "ok" | "partial" | "failed";
  files: FileReport[];
}

/** Expande ZIPs (export completo de Substack) y devuelve todas las rutas CSV de un directorio. */
export function collectCsvPaths(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) continue;
    const ext = extname(name).toLowerCase();
    if (ext === ".csv") out.push(p);
    else if (ext === ".zip") {
      const tmp = mkdtempSync(join(tmpdir(), "stackchat-zip-"));
      new AdmZip(p).extractAllTo(tmp, true);
      for (const inner of readdirSync(tmp)) if (extname(inner).toLowerCase() === ".csv") out.push(join(tmp, inner));
    }
  }
  return out;
}

/**
 * Bundles JSON que acompañan a los CSV en el directorio crudo:
 *  - `kind: "notes"`            — notas e interacciones (lo produce la ingesta y el navegador).
 *  - `kind: "stackchat-files"`  — varios CSV dentro de un solo archivo. La vía del navegador lo usa
 *    porque Chrome bloquea las descargas automáticas múltiples: un archivo, una descarga.
 */
function loadJsonBundles(
  db: Db,
  runId: number,
  dir: string,
  files: FileReport[],
  insRaw: ReturnType<Db["prepare"]>,
) {
  for (const name of readdirSync(dir)) {
    if (extname(name).toLowerCase() !== ".json") continue;
    const path = join(dir, name);
    const rep: FileReport = { path, kind: "unknown", rows: 0 };
    try {
      const buf = readFileSync(path);
      const data = JSON.parse(buf.toString("utf8")) as { kind?: string; notes?: unknown; files?: Record<string, string> };
      const sha = createHash("sha256").update(buf).digest("hex");
      if (data.kind === "notes" && Array.isArray(data.notes)) {
        rep.kind = "notes";
        rep.rows = data.notes.length;
        insRaw.run(runId, "notes", path, sha, rep.rows);
        rep.result = loadNotes(db, runId, data as NotesBundle);
        // "chatstack-files" es el nombre anterior al renombrado; se acepta para no romper bundles ya generados.
      } else if ((data.kind === "stackchat-files" || data.kind === "chatstack-files") && data.files && typeof data.files === "object") {
        // Se materializan a un directorio temporal para reusar tal cual la ruta de CSV.
        const tmp = mkdtempSync(join(tmpdir(), "stackchat-bundle-"));
        const written: string[] = [];
        for (const [fileName, content] of Object.entries(data.files)) {
          if (typeof content !== "string") continue;
          const p = join(tmp, basename(fileName));
          writeFileSync(p, content, "utf8");
          written.push(p);
        }
        insRaw.run(runId, "stackchat-files", path, sha, written.length);
        files.push(...loadCsvPaths(db, runId, written, insRaw));
        continue; // sus CSV ya se reportan uno a uno; el contenedor no añade una fila propia
      } else rep.error = "JSON sin `kind` reconocido; no cargado";
    } catch (e) {
      rep.error = String(e);
    }
    files.push(rep);
  }
}

/** El orden importa: posts antes que email_stats (join); el resto es independiente. */
const ORDER: CsvKind[] = [
  "posts",
  "email_stats",
  "email_list",
  "growth_sources",
  "traffic",
  "free_subscriber_growth",
  "paid_subscriber_growth",
  "subscriber_totals",
  "unknown",
];

interface Parsed {
  path: string;
  rows: Row[];
  sha256: string;
  kind: CsvKind;
  error?: string;
}

/** Parsea, ordena y carga un conjunto de rutas CSV dentro de un run ya abierto. */
function loadCsvPaths(db: Db, runId: number, paths: string[], insRaw: ReturnType<Db["prepare"]>): FileReport[] {
  const out: FileReport[] = [];
  const parsed: Parsed[] = paths.map((path) => {
    try {
      const { rows, headers, sha256 } = readCsv(path);
      return { path, rows, sha256, kind: detectKind(headers) };
    } catch (e) {
      return { path, rows: [], sha256: "", kind: "unknown", error: String(e) };
    }
  });
  parsed.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

  for (const f of parsed) {
    const rep: FileReport = { path: f.path, kind: f.kind, rows: f.rows.length };
    if (f.error) rep.error = f.error;
    else {
      insRaw.run(runId, f.kind, f.path, f.sha256, f.rows.length);
      try {
        switch (f.kind) {
          case "email_list":
            rep.result = loadEmailList(db, runId, f.rows);
            break;
          case "posts":
            rep.result = loadPosts(db, runId, f.rows);
            break;
          case "email_stats":
            rep.result = loadEmailStats(db, runId, f.rows);
            break;
          case "growth_sources":
            rep.result = loadGrowthSources(db, runId, f.rows);
            break;
          case "traffic":
            rep.result = loadTraffic(db, runId, f.rows);
            break;
          case "free_subscriber_growth":
            rep.result = loadSubscriberGrowth(db, runId, f.rows, "free");
            break;
          case "paid_subscriber_growth":
            rep.result = loadSubscriberGrowth(db, runId, f.rows, "paid");
            break;
          case "subscriber_totals":
            rep.result = loadSubscriberTotals(db, runId, f.rows);
            break;
          default:
            rep.error = "cabeceras no reconocidas; archivo registrado pero no cargado";
        }
      } catch (e) {
        rep.error = String(e);
      }
    }
    out.push(rep);
  }
  return out;
}

export function loadDirectory(db: Db, dir: string): RunReport {
  const runId = startRun(db, dir);
  const insRaw = db.prepare("INSERT INTO raw_files (run_id, kind, path, sha256, row_count) VALUES (?, ?, ?, ?, ?)");
  const files: FileReport[] = loadCsvPaths(db, runId, collectCsvPaths(dir), insRaw);

  loadJsonBundles(db, runId, dir, files, insRaw);

  const loaded = files.filter((f) => f.result).length;
  const failed = files.filter((f) => f.error && f.kind !== "unknown").length;
  const status: RunReport["status"] = loaded === 0 ? "failed" : failed > 0 ? "partial" : "ok";
  const notes = files
    .map((f) => `${basename(f.path)}: ${f.kind}${f.error ? ` (${f.error})` : ""}`)
    .join("\n");
  finishRun(db, runId, status, notes);
  return { runId, status, files };
}
