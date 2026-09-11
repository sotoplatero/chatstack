#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve, join } from "node:path";
import { readFileSync } from "node:fs";
import { openDb } from "./db/index.js";
import { loadDirectory, type RunReport } from "./load/index.js";
import { ingestSubstack } from "./ingest/substack.js";
import { cookieFromCurl, loadAuth, saveAuth } from "./ingest/auth.js";
import { serveStdio } from "./mcp/server.js";
import { helpText, parseFlags, runQuery, UsageError } from "./queryCommand.js";
import { querySql } from "./queries.js";

const HELP = `constack — tus datos de Substack en una base local que puedes consultar

Uso:
  constack sync   --sub <subdominio> [--cookies <archivo.curl>] [--db <ruta>] [--data <dir>]
                  Descarga los exports por la API del panel con tu sesión y los carga en la BD.
                  La primera vez pasa --cookies (Chrome → DevTools → Network → Copy as cURL);
                  la sesión queda en <data>/substack-auth.json para los siguientes syncs.
  constack load   <carpeta> [--db <ruta>]
                  Carga CSV/ZIP exportados a mano desde el panel de Substack.
  constack q <consulta> [--flags]   [--db <ruta>]
                  Consulta la BD y escribe JSON en stdout. Consultas:
${helpText()}

  constack sql "<SELECT ...>"       [--db <ruta>] [--max-rows N]
                  SELECT de solo lectura sobre la BD (LIMIT 200 por defecto).

  constack mcp    [--db <ruta>]
                  Arranca el MCP server (stdio). Conéctalo a Claude Code:
                  claude mcp add constack -- node <ruta>/dist/cli.js mcp --db <ruta>/data/constack.db

Variables de entorno: CONSTACK_DB, CONSTACK_DATA, CONSTACK_SUB
`;

/** `:memory:` no es una ruta: resolverla la convertiría en un archivo dentro del cwd. */
function resolveDb(db: string | undefined, dataDir: string): string {
  const v = db ?? process.env.CONSTACK_DB;
  if (v === ":memory:") return v;
  return resolve(v ?? join(dataDir, "constack.db"));
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const log = (m: string) => process.stderr.write(m + "\n");

  // `q` y `sql` llevan flags libres (--limit, --sort, --kind…) que parseArgs rechazaría por no
  // estar declaradas, así que se parsean a mano antes de llegar a él.
  if (cmd === "q" || cmd === "sql") {
    const name = argv[1];
    const flags = parseFlags(argv.slice(2));
    const dataDir = resolve(typeof flags.data === "string" ? flags.data : (process.env.CONSTACK_DATA ?? "data"));
    const dbPath = resolveDb(typeof flags.db === "string" ? flags.db : undefined, dataDir);
    if (!name) {
      log(cmd === "q" ? `Falta la consulta: constack q <consulta>\n\n${helpText()}` : 'Falta la consulta: constack sql "SELECT ..."');
      process.exit(2);
    }
    const db = openDb(dbPath);
    const result =
      cmd === "q"
        ? runQuery(db, name, flags)
        : querySql(db, name, typeof flags["max-rows"] === "string" ? Number(flags["max-rows"]) : 200);
    process.stdout.write(JSON.stringify(result, null, 1) + "\n");
    return;
  }

  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      db: { type: "string" },
      data: { type: "string" },
      sub: { type: "string" },
      cookies: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (!cmd || values.help) {
    process.stdout.write(HELP);
    process.exit(cmd ? 0 : 1);
  }
  const dataDir = resolve(values.data ?? process.env.CONSTACK_DATA ?? "data");
  const dbPath = resolveDb(values.db, dataDir);

  switch (cmd) {
    case "mcp": {
      const db = openDb(dbPath);
      await serveStdio(db);
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
      const authPath = join(dataDir, "substack-auth.json");
      let auth = loadAuth(authPath);
      if (values.cookies) {
        auth = saveAuth(authPath, cookieFromCurl(readFileSync(resolve(values.cookies), "utf8")));
        log(`sesión guardada en ${authPath}`);
      }
      if (!auth) {
        log(`No hay sesión guardada. Pasa --cookies <archivo.curl> la primera vez (ver README).`);
        process.exit(1);
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const rawDir = join(dataDir, "raw", stamp);
      const ingest = await ingestSubstack({ subdomain: sub, rawDir, cookie: auth.cookie, log });
      if (ingest.sessionExpired) {
        log("La sesión de Substack ha caducado. Vuelve a pasar --cookies con un cURL nuevo.");
      }
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

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  // Un error de uso (flag mal puesto, consulta inexistente) no es un fallo del programa.
  process.exit(e instanceof UsageError ? 2 : 1);
});
