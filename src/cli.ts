import { parseArgs } from "node:util";
import { resolve, join } from "node:path";
import { readFileSync } from "node:fs";
import { openDb } from "./db/index.js";
import { loadDirectory, type RunReport } from "./load/index.js";
import { ingestSubstack } from "./ingest/substack.js";
import { cookieFromCurl, loadAuth } from "./ingest/auth.js";
import { helpText, parseFlags, runQuery, UsageError } from "./queryCommand.js";
import { coverage, knownNotes, missingDatasets, querySql } from "./queries.js";
import { connect } from "./connect.js";
import { acquireLock, isFresh, readLastSyncLog, relaunchDetached, releaseLock, writeSyncLog } from "./syncControl.js";
import { authPath, stackchatHome, dbPath as resolveDbPath, loadConfig, rawDir, resolveSubdomain } from "./paths.js";

const HELP = `stackchat — tus datos de Substack en una base local que puedes consultar

Uso:
  stackchat connect --cookies <archivo.curl> [--sub <subdominio>]
                  Verifica tu sesión, detecta tu publicación y lo guarda en ~/.stackchat.
                  El archivo sale de Chrome: en el panel de Substack, F12 → Network →
                  recargar → clic derecho en la primera petición → Copy as cURL (bash).
  stackchat status
                  Dice si hay sesión, a qué publicación apunta y cuándo fue el último sync.
  stackchat sync  [--full] [--if-stale <horas>] [--background] [--sub <subdominio>]
                  Descarga tus datos de Substack y los carga en la base. Por defecto es
                  incremental: solo pide las interacciones de las notas cuyos contadores
                  han cambiado, y acorta el rango de las series (~10 s sin novedades,
                  frente a 3-4 min de un sync completo). --full lo fuerza todo.
                  --if-stale N no hace nada si el último sync es más reciente que N horas.
                  --background se desasocia y devuelve al instante (para hooks).
  stackchat load  <carpeta>
                  Carga CSV/ZIP/notes.json ya descargados (lo usa la vía del navegador).
  stackchat q <consulta> [--flags]
                  Consulta la base y escribe JSON en stdout. Consultas:
${helpText()}

  stackchat sql "<SELECT ...>" [--max-rows N]
                  SELECT de solo lectura sobre la base (LIMIT 200 por defecto).

Todo vive en ~/.stackchat (config.json, auth.json, stackchat.db, raw/).
Variables: STACKCHAT_HOME, STACKCHAT_DB, STACKCHAT_SUB.
`;

async function main() {
  // `stackchat q ... | head` cierra la salida antes de tiempo: sin esto Node vuelca un EPIPE feo.
  for (const s of [process.stdout, process.stderr]) {
    s.on("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "EPIPE") process.exit(0);
      throw e;
    });
  }
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
      log(cmd === "q" ? `Falta la consulta: stackchat q <consulta>\n\n${helpText()}` : 'Falta la consulta: stackchat sql "SELECT ..."');
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
      full: { type: "boolean" },
      background: { type: "boolean" },
      "if-stale": { type: "string" },
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
          "Falta el archivo: stackchat connect --cookies <archivo.curl>\n\n" +
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
      log(`Guardado en ${stackchatHome()}`);
      log(`Borra ${curlFile} cuando termines: contiene tu sesión.`);
      log("Ahora: stackchat sync");
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
            home: stackchatHome(),
            connected: !!auth,
            subdomain: config?.subdomain ?? null,
            publication_name: config?.publication_name ?? null,
            handle: config?.handle ?? null,
            db: dbFile,
            last_sync: last ?? null,
            last_background_sync: readLastSyncLog(),
            // Qué hay y qué falta: el skill lo mira para lanzar un sync sin que se lo pidan.
            coverage: coverage(db),
            missing: missingDatasets(db),
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
        log("Falta la carpeta: stackchat load <carpeta>");
        process.exit(2);
      }
      printReport(loadDirectory(openDb(dbFile), resolve(dir)), log);
      return;
    }
    case "sync": {
      const sub = resolveSubdomain(values.sub);
      const auth = loadAuth(authPath());
      if (!sub || !auth) {
        log("No hay sesión guardada. Ejecuta primero:\n  stackchat connect --cookies <archivo.curl>");
        process.exit(2);
      }
      const db = openDb(dbFile);

      // Guardia de frescura: es lo que hace tolerable un hook en cada sesión.
      if (values["if-stale"] !== undefined) {
        const horas = Number(values["if-stale"]);
        if (!Number.isFinite(horas) || horas < 0) {
          log("--if-stale espera un número de horas, p. ej. --if-stale 6");
          process.exit(2);
        }
        if (isFresh(db, horas)) {
          log(`Los datos tienen menos de ${horas} h; no hay nada que hacer.`);
          return;
        }
      }

      // Desasociarse ANTES de trabajar: SessionStart bloquea la sesión hasta que el comando acaba.
      if (values.background) {
        const args = [process.argv[1], ...process.argv.slice(2).filter((a) => a !== "--background")];
        log(`sync lanzado en segundo plano (pid ${relaunchDetached(args)})`);
        return;
      }

      // Un candado: con un hook global, tres sesiones abiertas lanzarían tres syncs simultáneos
      // contra una API que ya nos limita con 429.
      if (!acquireLock()) {
        log("Ya hay un sync en marcha; no lanzo otro.");
        return;
      }
      try {
        const code = await runSync({ sub, cookie: auth.cookie, db, full: !!values.full, log });
        if (code) process.exit(code);
      } finally {
        releaseLock();
      }
      return;
    }
    default:
      log(`Comando desconocido: ${cmd}\n`);
      process.stdout.write(HELP);
      process.exit(2);
  }
}

/**
 * Descarga y carga. Devuelve el código de salida (0 = bien, 3 = algo falló pero se cargó el resto),
 * en vez de llamar a process.exit, para que quien la use pueda soltar el candado primero.
 */
async function runSync(o: {
  sub: string;
  cookie: string;
  db: ReturnType<typeof openDb>;
  full: boolean;
  log: (m: string) => void;
}): Promise<number> {
  const dir = join(rawDir(), new Date().toISOString().replace(/[:.]/g, "-"));
  const ingest = await ingestSubstack({
    subdomain: o.sub,
    rawDir: dir,
    cookie: o.cookie,
    log: o.log,
    // Sin `knownNotes` el sync es completo; con él, solo pide lo que cambió.
    knownNotes: o.full ? undefined : knownNotes(o.db),
    // Las series viejas ya están en la BD y no cambian: en incremental, solo los últimos 120 días.
    seriesFrom: o.full ? undefined : new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10),
  });
  if (ingest.sessionExpired) {
    o.log("La sesión de Substack ha caducado. Repite `stackchat connect` con un cURL nuevo.");
    writeSyncLog("falló: la sesión de Substack ha caducado");
    return 2;
  }
  if (ingest.failed.length) o.log(`Fallaron: ${ingest.failed.map((f) => `${f.kind} (${f.error})`).join("; ")}`);
  if (!ingest.downloaded.length) {
    o.log("No se descargó nada; no hay nada que cargar.");
    writeSyncLog("falló: no se descargó nada");
    return 2;
  }
  const rep = loadDirectory(o.db, dir);
  printReport(rep, o.log);
  writeSyncLog(
    `sync #${rep.runId} ${rep.status}${ingest.failed.length ? ` (${ingest.failed.length} fuentes fallaron)` : ""}`,
  );
  return ingest.failed.length ? 3 : 0;
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
