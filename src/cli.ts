import { parseArgs } from "node:util";
import { resolve, join } from "node:path";
import { readFileSync } from "node:fs";
import { openDb } from "./db/index.js";
import { loadDirectory, type RunReport } from "./load/index.js";
import { ingestSubstack } from "./ingest/substack.js";
import { cookieFromCurl, loadAuth } from "./ingest/auth.js";
import { helpText, parseFlags, runQuery, UsageError } from "./queryCommand.js";
import { querySql } from "./queries.js";
import { connect } from "./connect.js";
import { authPath, chatstackHome, dbPath as resolveDbPath, loadConfig, rawDir, resolveSubdomain } from "./paths.js";

const HELP = `chatstack — tus datos de Substack en una base local que puedes consultar

Uso:
  chatstack connect --cookies <archivo.curl> [--sub <subdominio>]
                  Verifica tu sesión, detecta tu publicación y lo guarda en ~/.chatstack.
                  El archivo sale de Chrome: en el panel de Substack, F12 → Network →
                  recargar → clic derecho en la primera petición → Copy as cURL (bash).
  chatstack status
                  Dice si hay sesión, a qué publicación apunta y cuándo fue el último sync.
  chatstack sync  [--sub <subdominio>]
                  Descarga tus datos de Substack y los carga en la base.
  chatstack load  <carpeta>
                  Carga CSV/ZIP/notes.json ya descargados (lo usa la vía del navegador).
  chatstack q <consulta> [--flags]
                  Consulta la base y escribe JSON en stdout. Consultas:
${helpText()}

  chatstack sql "<SELECT ...>" [--max-rows N]
                  SELECT de solo lectura sobre la base (LIMIT 200 por defecto).

Todo vive en ~/.chatstack (config.json, auth.json, chatstack.db, raw/).
Variables: CHATSTACK_HOME, CHATSTACK_DB, CHATSTACK_SUB.
`;

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const log = (m: string) => process.stderr.write(m + "\n");

  // `q` y `sql` llevan flags libres (--limit, --sort, --kind…) que parseArgs rechazaría por no
  // estar declaradas, así que se parsean a mano antes de llegar a él.
  if (cmd === "q" || cmd === "sql") {
    const name = argv[1];
    const flags = parseFlags(argv.slice(2));
    const db = openDb(resolveDbPath(typeof flags.db === "string" ? flags.db : undefined));
    if (!name) {
      log(cmd === "q" ? `Falta la consulta: chatstack q <consulta>\n\n${helpText()}` : 'Falta la consulta: chatstack sql "SELECT ..."');
      process.exit(2);
    }
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
      sub: { type: "string" },
      cookies: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (!cmd || values.help) {
    process.stdout.write(HELP);
    process.exit(cmd ? 0 : 1);
  }
  const dbFile = resolveDbPath(values.db);

  switch (cmd) {
    case "connect": {
      if (!values.cookies) {
        log(
          "Falta el archivo: chatstack connect --cookies <archivo.curl>\n\n" +
            "Sácalo de Chrome: abre el panel de tu Substack, F12 → pestaña Network → recarga con\n" +
            "Ctrl+R → clic derecho en la primera petición → Copy → Copy as cURL (bash) → pégalo\n" +
            "en un archivo de texto y pasa su ruta aquí.",
        );
        process.exit(2);
      }
      const curlFile = resolve(values.cookies);
      const r = await connect(cookieFromCurl(readFileSync(curlFile, "utf8")), { subdomain: values.sub });
      if (!r.config) {
        log(
          "Administras varias publicaciones. Repite eligiendo una con --sub:\n" +
            r.needsChoice.map((p) => `  --sub ${p.subdomain}${p.name ? `   (${p.name})` : ""}`).join("\n"),
        );
        process.exit(2);
      }
      log(
        `Conectado como ${r.identity.handle ?? r.identity.user_id} → ${r.config.subdomain}` +
          `${r.config.publication_name ? ` (${r.config.publication_name})` : ""}`,
      );
      log(`Guardado en ${chatstackHome()}`);
      log(`Borra ${curlFile} cuando termines: contiene tu sesión.`);
      log("Ahora: chatstack sync");
      return;
    }
    case "status": {
      const config = loadConfig();
      const auth = loadAuth(authPath());
      const db = openDb(dbFile);
      const last = db
        .prepare("SELECT id, finished_at, status FROM sync_runs WHERE status <> 'running' ORDER BY id DESC LIMIT 1")
        .get() as { id: number; finished_at: string; status: string } | undefined;
      process.stdout.write(
        JSON.stringify(
          {
            home: chatstackHome(),
            connected: !!auth,
            subdomain: config?.subdomain ?? null,
            publication_name: config?.publication_name ?? null,
            handle: config?.handle ?? null,
            db: dbFile,
            last_sync: last ?? null,
          },
          null,
          1,
        ) + "\n",
      );
      return;
    }
    case "mcp": {
      // Import dinámico: el bundle del skill no arrastra el SDK de MCP, que no usa.
      const { serveStdio } = await import("./mcp/server.js");
      await serveStdio(openDb(dbFile));
      return;
    }
    case "load": {
      const dir = positionals[1];
      if (!dir) {
        log("Falta la carpeta: chatstack load <carpeta>");
        process.exit(2);
      }
      printReport(loadDirectory(openDb(dbFile), resolve(dir)), log);
      return;
    }
    case "sync": {
      const sub = resolveSubdomain(values.sub);
      const auth = loadAuth(authPath());
      if (!sub || !auth) {
        log("No hay sesión guardada. Ejecuta primero:\n  chatstack connect --cookies <archivo.curl>");
        process.exit(2);
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const dir = join(rawDir(), stamp);
      const ingest = await ingestSubstack({ subdomain: sub, rawDir: dir, cookie: auth.cookie, log });
      if (ingest.sessionExpired) {
        log("La sesión de Substack ha caducado. Repite `chatstack connect` con un cURL nuevo.");
      }
      if (ingest.failed.length) log(`Fallaron: ${ingest.failed.map((f) => `${f.kind} (${f.error})`).join("; ")}`);
      if (!ingest.downloaded.length) {
        log("No se descargó nada; no hay nada que cargar.");
        process.exit(2);
      }
      printReport(loadDirectory(openDb(dbFile), dir), log);
      if (ingest.failed.length) process.exit(3);
      return;
    }
    default:
      log(`Comando desconocido: ${cmd}\n`);
      process.stdout.write(HELP);
      process.exit(2);
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
  // Un error de uso (flag mal puesto, consulta inexistente, sesión inválida) no es un fallo del programa.
  process.exit(e instanceof UsageError || e?.constructor?.name === "NotConnectedError" ? 2 : 1);
});
