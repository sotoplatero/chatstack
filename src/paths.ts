import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

/**
 * Todo lo del usuario vive en `~/.chatstack/`, no en el repo: es lo que permite que el skill
 * se instale en cualquier máquina sin rutas incrustadas. `CHATSTACK_HOME` lo redirige (tests).
 */

export interface Config {
  subdomain: string;
  /** id numérico del usuario en substack.com; lo necesita el feed de Notes. */
  user_id?: number;
  handle?: string;
  publication_name?: string;
  connected_at?: string;
}

export function chatstackHome(): string {
  return process.env.CHATSTACK_HOME ? resolve(process.env.CHATSTACK_HOME) : join(homedir(), ".chatstack");
}

export const configPath = () => join(chatstackHome(), "config.json");
export const authPath = () => join(chatstackHome(), "auth.json");
export const rawDir = () => join(chatstackHome(), "raw");

/** `:memory:` no es una ruta; resolverla crearía un archivo con ese nombre. */
export function dbPath(override?: string): string {
  const v = override ?? process.env.CHATSTACK_DB ?? process.env.CONSTACK_DB;
  if (v === ":memory:") return v;
  return v ? resolve(v) : join(chatstackHome(), "chatstack.db");
}

export function ensureHome(): string {
  const dir = chatstackHome();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function loadConfig(): Config | null {
  const p = configPath();
  if (!existsSync(p)) return null;
  try {
    const c = JSON.parse(readFileSync(p, "utf8")) as Partial<Config>;
    return c.subdomain ? (c as Config) : null;
  } catch {
    return null;
  }
}

export function saveConfig(c: Config): Config {
  ensureHome();
  writeFileSync(configPath(), JSON.stringify(c, null, 2) + "\n", "utf8");
  return c;
}

/** El subdominio efectivo: primero lo que pida quien llama, luego el guardado, luego la variable. */
export function resolveSubdomain(explicit?: string): string | null {
  return explicit ?? loadConfig()?.subdomain ?? process.env.CHATSTACK_SUB ?? process.env.CONSTACK_SUB ?? null;
}
