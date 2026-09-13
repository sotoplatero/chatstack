import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

/**
 * Ejecuta el CLI de verdad. Las pruebas unitarias de `runQuery` no ven el cableado de argumentos,
 * y ahí es donde estaba el fallo: `parseArgs` rechazaba `--limit` por no estar declarada.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "src", "cli.ts");
const BUNDLE = join(ROOT, "skills", "stackchat", "bin", "stackchat.cjs");

function run(...args: string[]) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--no-warnings", CLI, ...args], {
    encoding: "utf8",
    timeout: 60_000,
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** El bundle es lo que se instala; probarlo aparte es lo único que detecta fallos de empaquetado. */
function runBundle(...args: string[]) {
  const r = spawnSync(process.execPath, ["--no-warnings", BUNDLE, ...args], { encoding: "utf8", timeout: 60_000 });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

describe("CLI", () => {
  it("acepta flags libres en `q` y devuelve JSON en stdout", () => {
    const r = run("q", "subscribers", "--limit", "5", "--plan", "free", "--db", ":memory:");
    expect(r.stderr).not.toMatch(/Unknown option/);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out).toMatchObject({ total: 0, limit: 5, offset: 0, rows: [] });
  });

  it("acepta --flag=valor igual que --flag valor", () => {
    const r = run("q", "note-engagers", "--limit=3", "--kind=reply", "--db", ":memory:");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual([]);
  });

  it("`sql` ejecuta un SELECT y rechaza escrituras", () => {
    const ok = run("sql", "SELECT 1 AS uno", "--db", ":memory:");
    expect(ok.status).toBe(0);
    expect(JSON.parse(ok.stdout).rows).toEqual([{ uno: 1 }]);

    const bad = run("sql", "DELETE FROM subscribers", "--db", ":memory:");
    expect(bad.status).not.toBe(0);
    expect(bad.stderr).toMatch(/SELECT/);
  });

  it("una consulta desconocida sale con código 2 y lista las válidas", () => {
    const r = run("q", "suscriptores", "--db", ":memory:");
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("subscribers");
    expect(r.stdout).toBe("");
  });

  it("un valor fuera de la lista cerrada falla con código 2", () => {
    const r = run("q", "posts", "--sort", "aperturas", "--db", ":memory:");
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/debe ser uno de/);
  });

  it("no vuelca un EPIPE cuando cierran la salida (`| head`)", () => {
    // `stackchat q ... | head` es de lo más común y cierra stdout a media escritura.
    const cli = CLI.split("\\").join("/");
    const r = spawnSync("bash", ["-c", `"${process.execPath}" --import tsx --no-warnings "${cli}" q overview --db :memory: | head -2`], {
      encoding: "utf8",
      timeout: 60_000,
    });
    expect(r.stderr ?? "").not.toMatch(/EPIPE|Unhandled|throw er/);
    expect(r.stdout ?? "").toContain("{");
  });

  it("`--db :memory:` no se convierte en una ruta del disco", () => {
    const r = run("q", "overview", "--db", ":memory:");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).subscribers.total).toBe(0);
  });
});

describe("bundle del skill", () => {
  // Si el bundle no está construido, `npm run build` no se ha ejecutado: mejor fallar que fingir.
  it("existe", () => {
    expect(existsSync(BUNDLE), `falta ${BUNDLE}; ejecuta npm run build`).toBe(true);
  });

  it("corre aislado, sin node_modules ni package.json alrededor", () => {
    const r = runBundle("q", "overview", "--db", ":memory:");
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).subscribers.total).toBe(0);
  });

  it("`status` en un HOME limpio dice que no hay sesión", () => {
    const home = mkdtempSync(join(tmpdir(), "stackchat-bundle-"));
    const r = spawnSync(process.execPath, ["--no-warnings", BUNDLE, "status"], {
      encoding: "utf8", timeout: 60_000, env: { ...process.env, STACKCHAT_HOME: home },
    });
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout ?? "");
    expect(out).toMatchObject({ connected: false, subdomain: null, last_sync: null });
    rmSync(home, { recursive: true, force: true });
  });

  it("los snippets de navegador están generados y piden los endpoints correctos", () => {
    const dir = join(ROOT, "skills", "stackchat", "browser");
    const pub = readFileSync(join(dir, "01-publication.js"), "utf8");
    const notes = readFileSync(join(dir, "02-notes.js"), "utf8");
    for (const needle of ["stats/email_stats", "growth/sources", "publication_traffic", "paid_subscriber_growth", "/api/v1/archive", "subscriber_set"]) {
      expect(pub, needle).toContain(needle);
    }
    for (const needle of ["reader/feed/profile", "/reactors", "/restackers", "/replies", "note_stats"]) {
      expect(notes, needle).toContain(needle);
    }
    for (const snippet of [pub, notes]) {
      // Arrancan y devuelven: `javascript_tool` corta a los 45 s y el trabajo dura minutos.
      expect(snippet).toContain("window.__stackchat");
      expect(snippet).toContain("P.listo = true");
      expect(snippet).toMatch(/arrancado/);
      // Una sola descarga, y solo si el agente la pide: Chrome bloquea las automáticas repetidas
      // de un sitio, y el resultado de `javascript_tool` se trunca a ~1 KB, así que el bundle no
      // puede salir por ahí. `descargar()` existe, pero el snippet nunca la invoca por su cuenta.
      expect(snippet.match(/a\.click\(\)/g)?.length).toBe(1);
      expect(snippet).toContain("P.descargar = ");
      // Se mira el código sin comentarios ni literales de texto: ambos nombran `P.descargar()`
      // para decirle al agente cuándo llamarla, y eso no es una invocación.
      const codigo = snippet.replace(/^\s*\/\/.*$/gm, "").replace(/'[^'\n]*'/g, "''");
      expect(codigo).not.toMatch(/(?<!P\.)descargar\(\)|P\.descargar\(/);
      // Todo error queda dentro del objeto de progreso, no revienta la página.
      expect(snippet).toContain("P.error =");
    }
    // El id del export llega con tres nombres distintos según la versión de Substack.
    expect(pub).toContain("o.export_id || o.id || o.exportId");
    // note_stats se reduce a cifras: en crudo son ~12 KB por nota.
    expect(notes).toContain("const cifras =");
  });
});
