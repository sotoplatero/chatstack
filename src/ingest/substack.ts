import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AgentBrowser, findRef } from "./agentBrowser.js";

export interface IngestOptions {
  subdomain: string;
  rawDir: string;
  session?: string;
  stateFile?: string;
  cookiesCurl?: string;
  log?: (msg: string) => void;
}

export interface IngestReport {
  rawDir: string;
  downloaded: { kind: string; path: string }[];
  failed: { kind: string; error: string }[];
}

/** Patrones de texto de los controles de exportar; la UI de Substack es bilingüe y cambia, por eso no hay selectores fijos. */
const EXPORT_BTN = [/\b(export|exportar|download|descargar)\b/i, /csv/i];
const TAB = (names: string[]) => names.map((n) => new RegExp(`\\b${n}\\b`, "i"));

type Step = { kind: string; run: (b: AgentBrowser, dest: string) => void };

function steps(sub: string): Step[] {
  const base = `https://${sub}.substack.com/publish`;
  const clickTabThenExport = (b: AgentBrowser, tabNames: string[], dest: string) => {
    let snap = b.snapshot();
    const tab = findRef(snap, TAB(tabNames));
    if (tab) {
      b.click(tab);
      snap = b.snapshot();
    }
    let btn = findRef(snap, EXPORT_BTN);
    if (!btn) {
      // Algunos paneles esconden el export tras un menú "⋯".
      const menu = findRef(snap, [/more|más|⋯|\.\.\./i]);
      if (menu) {
        b.click(menu);
        snap = b.snapshot();
        btn = findRef(snap, EXPORT_BTN);
      }
    }
    if (!btn) throw new Error(`no encuentro el control de exportar (pestaña ${tabNames[0]})`);
    b.download(btn, dest);
  };

  return [
    {
      kind: "email_list",
      run: (b, dest) => {
        b.open(`${base}/subscribers`);
        assertLoggedIn(b);
        clickTabThenExport(b, ["Subscribers", "Suscriptores", "All", "Todos"], dest);
      },
    },
    {
      kind: "growth_sources",
      run: (b, dest) => {
        b.open(`${base}/subscribers`);
        clickTabThenExport(b, ["Growth", "Crecimiento"], dest);
      },
    },
    {
      kind: "email_stats",
      run: (b, dest) => {
        b.open(`${base}/stats`);
        clickTabThenExport(b, ["Posts", "Publicaciones"], dest);
      },
    },
    {
      kind: "traffic",
      run: (b, dest) => {
        b.open(`${base}/stats`);
        clickTabThenExport(b, ["Traffic", "Tráfico"], dest);
      },
    },
    {
      kind: "posts_zip",
      run: (b, dest) => {
        // Export completo: asíncrono. Si ya hay uno reciente listo, se descarga; si no, se solicita y se sondea.
        b.open(`${base}/settings#import-export-settings`);
        let snap = b.snapshot();
        let dl = findRef(snap, [/\b(download|descargar)\b/i]);
        if (!dl) {
          const newExport = findRef(snap, [/new export|nueva exportaci[oó]n|create export|crear exportaci[oó]n/i]);
          if (!newExport) throw new Error("no encuentro 'New export' en Import/Export");
          b.click(newExport);
          for (let i = 0; i < 12 && !dl; i++) {
            sleep(10_000);
            b.open(`${base}/settings#import-export-settings`);
            snap = b.snapshot();
            dl = findRef(snap, [/\b(download|descargar)\b/i]);
          }
        }
        if (!dl) throw new Error("el export completo no estuvo listo en 2 minutos; Substack lo enviará por correo");
        b.download(dl, dest);
      },
    },
  ];
}

function assertLoggedIn(b: AgentBrowser) {
  const u = b.url();
  if (/sign-in|login/i.test(u)) {
    throw new Error(
      "sesión de Substack caducada o inexistente. Repite el import de cookies: constack sync --cookies <archivo.curl>",
    );
  }
}

function sleep(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* espera síncrona: el flujo entero es secuencial sobre la CLI */
  }
}

export function ingestSubstack(opts: IngestOptions): IngestReport {
  const log = opts.log ?? (() => {});
  const session = opts.session ?? "constack";
  const stateFile = opts.stateFile;
  mkdirSync(opts.rawDir, { recursive: true });
  const report: IngestReport = { rawDir: opts.rawDir, downloaded: [], failed: [] };
  const b = new AgentBrowser(session, stateFile && existsSync(stateFile) ? stateFile : undefined, log);

  // Cold start del daemon: el primer open puede tardar; se tolera el fallo y se comprueba con `get url`.
  try {
    b.open(`https://${opts.subdomain}.substack.com`);
  } catch (e) {
    log(`open inicial lento/fallido (normal en cold start): ${String(e).slice(0, 120)}`);
  }
  b.url();

  if (opts.cookiesCurl) {
    log("importando cookies desde archivo cURL…");
    b.setCookiesFromCurl(opts.cookiesCurl);
    b.open(`https://${opts.subdomain}.substack.com/publish/home`);
    assertLoggedIn(b);
    if (stateFile) {
      b.saveState(stateFile);
      log(`sesión guardada en ${stateFile}`);
    }
  }

  for (const step of steps(opts.subdomain)) {
    const dest = join(opts.rawDir, step.kind === "posts_zip" ? "export.zip" : `${step.kind}.csv`);
    try {
      log(`→ ${step.kind}`);
      step.run(b, dest);
      if (!existsSync(dest) || statSync(dest).size === 0) throw new Error("el archivo no se descargó o está vacío");
      report.downloaded.push({ kind: step.kind, path: dest });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(`  ✗ ${step.kind}: ${msg}`);
      report.failed.push({ kind: step.kind, error: msg });
      if (/caducada|inexistente/.test(msg)) break; // sin sesión no tiene sentido seguir
    }
  }
  b.close();
  log(`descargados: ${readdirSync(opts.rawDir).join(", ") || "(ninguno)"}`);
  return report;
}
