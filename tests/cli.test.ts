import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

/**
 * Ejecuta el CLI de verdad. Las pruebas unitarias de `runQuery` no ven el cableado de argumentos,
 * y ahí es donde estaba el fallo: `parseArgs` rechazaba `--limit` por no estar declarada.
 */
const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cli.ts");

function run(...args: string[]) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--no-warnings", CLI, ...args], {
    encoding: "utf8",
    timeout: 60_000,
  });
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
    const r = run("q", "posts", "--sort", "opens", "--db", ":memory:");
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/debe ser uno de/);
  });

  it("`--db :memory:` no se convierte en una ruta del disco", () => {
    const r = run("q", "overview", "--db", ":memory:");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).subscribers.total).toBe(0);
  });
});
