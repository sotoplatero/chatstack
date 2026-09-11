import { SOCIAL, SOCIAL_ORIGIN } from "./ingest/endpoints.js";
import { saveAuth } from "./ingest/auth.js";
import { authPath, saveConfig, type Config } from "./paths.js";

/**
 * Verifica una sesión de Substack y averigua a qué publicación pertenece ANTES de guardar nada,
 * para que un cURL caducado falle en dos segundos y no a mitad de una descarga de cuatro minutos.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

export interface Publication {
  subdomain: string;
  name: string | null;
  id?: number;
}

export interface Identity {
  user_id: number;
  handle: string | null;
  name: string | null;
  publications: Publication[];
}

export class NotConnectedError extends Error {}

/** Lee identidad y publicaciones administradas. Lanza NotConnectedError si la sesión no vale. */
export async function verifySession(cookie: string, fetchImpl: typeof fetch = fetch): Promise<Identity> {
  const get = async (path: string) => {
    const res = await fetchImpl(SOCIAL_ORIGIN + path, {
      headers: { "user-agent": UA, cookie, accept: "application/json" },
      redirect: "follow",
    });
    if (res.status === 401 || res.status === 403) throw new NotConnectedError("La sesión de Substack no es válida o ha caducado.");
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}`);
    const text = await res.text();
    if (/^\s*<!doctype html/i.test(text)) throw new NotConnectedError("Substack respondió con la página de login: la sesión no vale.");
    return JSON.parse(text) as Record<string, any>;
  };

  const me = await get(SOCIAL.self());
  if (!me?.id) throw new NotConnectedError("La respuesta no trae un id de usuario: la sesión no vale.");

  return {
    user_id: Number(me.id),
    handle: me.handle ?? null,
    name: me.name ?? null,
    publications: extractPublications(me),
  };
}

/**
 * Substack devuelve las publicaciones del usuario en varias formas según la cuenta; se recogen
 * todas las que traigan subdominio y se deduplican, en vez de confiar en una sola ruta.
 */
export function extractPublications(me: Record<string, any>): Publication[] {
  const found = new Map<string, Publication>();
  const add = (p: any) => {
    const subdomain = p?.subdomain;
    if (typeof subdomain === "string" && subdomain) {
      found.set(subdomain, { subdomain, name: p.name ?? null, id: p.id });
    }
  };
  add(me.primary_publication);
  for (const key of ["publications", "publicationUsers", "publication_users", "userPublications"]) {
    const list = me[key];
    if (Array.isArray(list)) for (const item of list) add(item?.publication ?? item);
  }
  return [...found.values()];
}

export interface ConnectResult {
  identity: Identity;
  /** `null` cuando hay varias publicaciones y nadie ha elegido: no se guarda nada. */
  config: Config | null;
  needsChoice: Publication[];
}

/**
 * Verifica la sesión y, si el subdominio es inequívoco (o viene dado), guarda config y cookie.
 * Con varias publicaciones y sin elección devuelve `needsChoice` sin escribir nada.
 */
export async function connect(
  cookie: string,
  opts: { subdomain?: string; fetchImpl?: typeof fetch } = {},
): Promise<ConnectResult> {
  const identity = await verifySession(cookie, opts.fetchImpl ?? fetch);
  const pubs = identity.publications;

  let chosen: Publication | undefined;
  if (opts.subdomain) {
    chosen = pubs.find((p) => p.subdomain === opts.subdomain) ?? { subdomain: opts.subdomain, name: null };
  } else if (pubs.length === 1) {
    chosen = pubs[0];
  }

  if (!chosen) return { identity, config: null, needsChoice: pubs };

  saveAuth(authPath(), cookie);
  const config = saveConfig({
    subdomain: chosen.subdomain,
    user_id: identity.user_id,
    handle: identity.handle ?? undefined,
    publication_name: chosen.name ?? undefined,
    connected_at: new Date().toISOString(),
  });
  return { identity, config, needsChoice: [] };
}
