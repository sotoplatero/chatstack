import { existsSync, readFileSync, writeFileSync, unlinkSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { Db } from "./db/index.js";
import { stackchatHome, ensureHome } from "./paths.js";

/**
 * Guardias del sync automático: frescura, candado y desasociación. Están aparte del sync porque
 * son decisiones de *cuándo* ejecutarlo, no de *cómo*, y así se prueban sin tocar la red.
 */

export const lockPath = () => join(stackchatHome(), "sync.lock");
export const logPath = () => join(stackchatHome(), "last-sync.log");

/** Un sync colgado no debe bloquear los siguientes para siempre. */
export const LOCK_TTL_MS = 15 * 60 * 1000;

export interface Lock {
  pid: number;
  started_at: string;
}

/**
 * Horas desde el último sync que salió bien, o null si no hay ninguno. Un run `partial` o
 * `failed` no cuenta: si dejó fuera una fuente, dar los datos por frescos es justo lo que
 * impediría reintentarla.
 */
export function hoursSinceLastSync(db: Db, now = Date.now()): number | null {
  const row = db
    .prepare("SELECT finished_at FROM sync_runs WHERE finished_at IS NOT NULL AND status = 'ok' ORDER BY id DESC LIMIT 1")
    .get() as { finished_at: string } | undefined;
  if (!row?.finished_at) return null;
  const t = Date.parse(row.finished_at);
  return Number.isFinite(t) ? (now - t) / 3_600_000 : null;
}

export function isFresh(db: Db, maxAgeHours: number, now = Date.now()): boolean {
  const h = hoursSinceLastSync(db, now);
  return h !== null && h < maxAgeHours;
}

/**
 * Toma el candado. Devuelve false si ya hay un sync vivo: con un hook global, abrir tres sesiones
 * de Claude Code a la vez lanzaría tres syncs contra una API que ya responde 429.
 */
export function acquireLock(now = Date.now(), pid = process.pid): boolean {
  ensureHome();
  const p = lockPath();
  if (existsSync(p)) {
    try {
      const held = JSON.parse(readFileSync(p, "utf8")) as Lock;
      const age = now - Date.parse(held.started_at);
      // Caducado o del propio proceso: se puede pisar. Vivo y ajeno: no.
      if (Number.isFinite(age) && age < LOCK_TTL_MS && held.pid !== pid && isAlive(held.pid)) return false;
    } catch {
      // Un candado ilegible es basura de un proceso muerto; se pisa.
    }
  }
  writeFileSync(p, JSON.stringify({ pid, started_at: new Date(now).toISOString() } satisfies Lock), "utf8");
  return true;
}

export function releaseLock(): void {
  try {
    unlinkSync(lockPath());
  } catch {
    // Ya no estaba: nada que soltar.
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Deja constancia del último sync automático para que `status` lo pueda contar. */
export function writeSyncLog(line: string): void {
  ensureHome();
  try {
    appendFileSync(logPath(), `${new Date().toISOString()} ${line}\n`, "utf8");
  } catch {
    // Un log que no se puede escribir no debe tumbar el sync.
  }
}

export function readLastSyncLog(): string | null {
  try {
    const lines = readFileSync(logPath(), "utf8").trim().split(/\r?\n/).filter(Boolean);
    return lines.length ? lines[lines.length - 1] : null;
  } catch {
    return null;
  }
}

/**
 * Relanza el propio CLI desasociado y devuelve el pid. Lo hace el CLI y no el shell porque
 * `SessionStart` bloquea el arranque de la sesión hasta que el comando termina, y porque así el
 * hook es idéntico en Windows, macOS y Linux.
 */
export function relaunchDetached(argv: string[], execPath = process.execPath): number | undefined {
  // El hijo se lanza con stdio ignorado, así que si no arranca muere sin dejar rastro y quien lo
  // lanzó seguiría anunciando una descarga que no existe. Eso pasa al ejecutar las fuentes con
  // `tsx`: el punto de entrada es TypeScript y node no lo sabe interpretar. Vale más decirlo.
  const entrada = argv[0] ?? "";
  if (!/\.(c|m)?js$/i.test(entrada)) return undefined;
  const child = spawn(execPath, argv, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  return child.pid;
}
