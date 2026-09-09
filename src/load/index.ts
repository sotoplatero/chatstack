import { readdirSync, statSync, mkdtempSync } from "node:fs";
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
      const tmp = mkdtempSync(join(tmpdir(), "constack-zip-"));
      new AdmZip(p).extractAllTo(tmp, true);
      for (const inner of readdirSync(tmp)) if (extname(inner).toLowerCase() === ".csv") out.push(join(tmp, inner));
    }
  }
  return out;
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

export function loadDirectory(db: Db, dir: string): RunReport {
  const runId = startRun(db, dir);
  const files: FileReport[] = [];
  const insRaw = db.prepare("INSERT INTO raw_files (run_id, kind, path, sha256, row_count) VALUES (?, ?, ?, ?, ?)");

  const parsed: Parsed[] = collectCsvPaths(dir).map((path) => {
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
          case "unknown":
            rep.error = "cabeceras no reconocidas; archivo registrado pero no cargado";
            break;
        }
      } catch (e) {
        rep.error = String(e);
      }
    }
    files.push(rep);
  }

  const loaded = files.filter((f) => f.result).length;
  const failed = files.filter((f) => f.error && f.kind !== "unknown").length;
  const status: RunReport["status"] = loaded === 0 ? "failed" : failed > 0 ? "partial" : "ok";
  const notes = files
    .map((f) => `${basename(f.path)}: ${f.kind}${f.error ? ` (${f.error})` : ""}`)
    .join("\n");
  finishRun(db, runId, status, notes);
  return { runId, status, files };
}
