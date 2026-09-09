#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve, join } from "node:path";
import { openDb } from "./db/index.js";
import { loadDirectory, type RunReport } from "./load/index.js";
import { ingestSubstack } from "./ingest/substack.js";
import { serveStdio } from "./mcp/server.js";

const HELP = `constack — MCP server local para tus datos de Substack

Uso:
  constack sync   --sub <subdominio> [--cookies <archivo.curl>] [--db <ruta>] [--data <dir>]
                  Descarga los exports con tu sesión de Chrome (agent-browser) y los carga en la BD.
  constack load   <carpeta> [--db <ruta>]
                  Carga CSV/ZIP exportados a mano desde el panel de Substack.
  constack mcp    [--db <ruta>]
                  Arranca el MCP server (stdio). Conéctalo a Claude Code:
                  claude mcp add constack -- node <ruta>/dist/cli.js mcp --db <ruta>/data/constack.db

Variables de entorno: CONSTACK_DB, CONSTACK_DATA, CONSTACK_SUB
`;

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      db: { type: "string" },
      data: { type: "string" },
      sub: { type: "string" },
      cookies: { type: "string" },
      session: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const cmd = positionals[0];
  if (!cmd || values.help) {
    process.stdout.write(HELP);
    process.exit(cmd ? 0 : 1);
  }
  const dataDir = resolve(values.data ?? process.env.CONSTACK_DATA ?? "data");
  const dbPath = resolve(values.db ?? process.env.CONSTACK_DB ?? join(dataDir, "constack.db"));
  const log = (m: string) => process.stderr.write(m + "\n");

  switch (cmd) {
    case "mcp": {
      const db = openDb(dbPath);
      serveStdio(db).catch((e) => {
        log(String(e));
        process.exit(1);
      });
      return;
    }
    case "load": {
      const dir = positionals[1];
      if (!dir) {
        log("Falta la carpeta: constack load <carpeta>");
        process.exit(1);
      }
      const db = openDb(dbPath);
      printReport(loadDirectory(db, resolve(dir)), log);
      return;
    }
    case "sync": {
      const sub = values.sub ?? process.env.CONSTACK_SUB;
      if (!sub) {
        log("Falta el subdominio: constack sync --sub <subdominio> (o CONSTACK_SUB)");
        process.exit(1);
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const rawDir = join(dataDir, "raw", stamp);
      const ingest = ingestSubstack({
        subdomain: sub,
        rawDir,
        session: values.session ?? "constack",
        stateFile: join(dataDir, "substack-auth.json"),
        cookiesCurl: values.cookies ? resolve(values.cookies) : undefined,
        log,
      });
      if (ingest.failed.length) log(`Fallaron: ${ingest.failed.map((f) => `${f.kind} (${f.error})`).join("; ")}`);
      if (!ingest.downloaded.length) {
        log("No se descargó nada; no hay nada que cargar.");
        process.exit(2);
      }
      const db = openDb(dbPath);
      printReport(loadDirectory(db, rawDir), log);
      if (ingest.failed.length) process.exit(3);
      return;
    }
    default:
      log(`Comando desconocido: ${cmd}\n`);
      process.stdout.write(HELP);
      process.exit(1);
  }
}

function printReport(rep: RunReport, log: (m: string) => void) {
  log(`Sync #${rep.runId}: ${rep.status}`);
  for (const f of rep.files) {
    const r = f.result ? ` → ${f.result.inserted} ins, ${f.result.updated} upd, ${f.result.skipped} skip` : "";
    log(`  ${f.kind.padEnd(24)} ${f.rows} filas${r}${f.error ? `  [${f.error}]` : ""}`);
  }
}

main();
