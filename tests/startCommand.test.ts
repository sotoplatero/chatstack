import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, recordFailedRun, startRun } from "../src/db/index.js";

/**
 * `start` es lo primero que se ejecuta al cargar el skill y lo unico que decide el arranque. Se
 * prueba contra el binario empaquetado porque parte de su trabajo es lanzar un proceso aparte, y
 * eso solo funciona igual que en produccion desde el bundle.
 */
const BIN = join(__dirname, "..", "skills", "stackchat", "bin", "stackchat.cjs");

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "stackchat-start-"));
});
afterEach(() => rmSync(home, { recursive: true, force: true }));

function correr(): any {
  const out = execFileSync(process.execPath, ["--no-warnings=ExperimentalWarning", BIN, "start"], {
    env: { ...process.env, STACKCHAT_HOME: home },
    encoding: "utf8",
  });
  return JSON.parse(out);
}

/**
 * Base con un sync correcto de hace `horas`. Registra ademas un archivo crudo por conjunto: sin
 * eso `missing` los da por nunca descargados y `start` lanzaria un sync con toda la razon, que no
 * es lo que estos casos quieren medir.
 */
const CONJUNTOS = [
  "email_list", "posts", "email_stats", "growth_sources", "traffic", "subscriber_totals",
  "paid_subscriber_growth", "notes", "followers", "unsubscribes", "visitor_sources",
  "network_attribution", "audience_location", "audience_overlap", "referrers", "pub_summary",
];
function baseConSync(horas: number) {
  const db = openDb(join(home, "stackchat.db"));
  const id = startRun(db, null);
  const cuando = new Date(Date.now() - horas * 3_600_000).toISOString();
  db.prepare("UPDATE sync_runs SET finished_at = ?, status = 'ok' WHERE id = ?").run(cuando, id);
  db.prepare("INSERT INTO subscribers (email, first_seen_at, plan) VALUES ('a@x.com', ?, 'free')").run(cuando);
  const raw = db.prepare("INSERT INTO raw_files (run_id, kind, path, sha256, row_count) VALUES (?, ?, '', '', 1)");
  for (const k of CONJUNTOS) raw.run(id, k);
  return db;
}

const sesion = () => {
  writeFileSync(join(home, "auth.json"), JSON.stringify({ cookie: "substack.sid=s", saved_at: "2026-09-01T00:00:00Z" }));
  writeFileSync(join(home, "config.json"), JSON.stringify({ subdomain: "x", publication_name: "P" }));
};

describe("start", () => {
  it("sin sesion devuelve los pasos para conseguirla, no un error", () => {
    const r = correr();
    expect(r.estado).toBe("sin_sesion");
    expect(r.hay_datos).toBe(false);
    expect(r.siguiente).toMatch(/cURL/);
    // Y no le pide el subdominio, que es lo que no puede saber.
    expect(r.siguiente).toMatch(/No le pidas el subdominio/);
  });

  it("con datos frescos no lanza nada y manda responder", () => {
    sesion();
    baseConSync(1).close();
    const r = correr();
    expect(r.estado).toBe("listo");
    expect(r.frescura).toBe("fresco");
    expect(r.actualizacion).toBeNull();
  });

  it("con datos viejos manda fechar las cifras", () => {
    sesion();
    baseConSync(72).close();
    const r = correr();
    expect(r.estado).toBe("listo_actualizando");
    expect(r.frescura).toBe("muy_viejo");
    expect(r.datos_de_hace_horas).toBeGreaterThan(70);
    // Lo importante: que el aviso sea explicito y no haya que deducirlo de una marca de tiempo.
    expect(r.siguiente).toMatch(/de cuándo son las cifras/);
  });

  it("con la sesion caducada lo dice y no relanza un sync condenado", () => {
    sesion();
    const db = baseConSync(1);
    // El motivo se lee de la base, no de una frase suelta en un archivo de texto: aquí se anota el
    // intento fallido igual que lo haría un sync de verdad.
    recordFailedRun(db, "session_expired", "la sesión de Substack ha caducado");
    db.close();
    const r = correr();
    expect(r.estado).toBe("sesion_caducada");
    // Reintentar no arregla una sesion caducada: seria una descarga condenada por invocacion.
    expect(r.actualizacion).toBeNull();
    expect(r.siguiente).toMatch(/cURL nuevo/);
    // Y aun asi se responde con lo que hay, fechado.
    expect(r.siguiente).toMatch(/de cuándo son las cifras/);
    expect(r.resumen).not.toBeNull();
  });
});
