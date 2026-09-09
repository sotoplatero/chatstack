import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface SubstackAuth {
  cookie: string;
  saved_at: string;
}

/**
 * Extrae la cabecera Cookie de un archivo "Copy as cURL (bash)" de Chrome.
 * Acepta tanto `-b '...'` / `--cookie '...'` como `-H 'cookie: ...'`.
 */
export function cookieFromCurl(text: string): string {
  const m =
    /(?:^|\s)(?:-b|--cookie)\s+(['"])([\s\S]*?)\1/m.exec(text) ??
    /-H\s+(['"])cookie:\s*([\s\S]*?)\1/im.exec(text);
  if (!m) throw new Error("el archivo cURL no contiene cookies (-b o -H 'cookie: ...')");
  const cookie = m[2].replace(/\s*\\\s*\n\s*/g, " ").trim();
  if (!/substack\.sid=/.test(cookie)) {
    throw new Error("las cookies no incluyen substack.sid; copia el cURL desde una pestaña del panel /publish estando logueado");
  }
  return cookie;
}

export function loadAuth(path: string): SubstackAuth | null {
  if (!existsSync(path)) return null;
  const a = JSON.parse(readFileSync(path, "utf8")) as Partial<SubstackAuth>;
  return a.cookie ? { cookie: a.cookie, saved_at: a.saved_at ?? "" } : null;
}

export function saveAuth(path: string, cookie: string): SubstackAuth {
  mkdirSync(dirname(path), { recursive: true });
  const auth = { cookie, saved_at: new Date().toISOString() };
  writeFileSync(path, JSON.stringify(auth, null, 2), { encoding: "utf8", mode: 0o600 });
  return auth;
}
