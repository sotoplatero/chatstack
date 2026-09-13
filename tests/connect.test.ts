import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { connect, verifySession, extractPublications, NotConnectedError } from "../src/connect.js";
import { stackchatHome, configPath, authPath, loadConfig, dbPath } from "../src/paths.js";

const COOKIE = "substack.sid=s%3Aabc; cf_clearance=x";

function fakeApi(me: Record<string, unknown> | number) {
  return (async () => {
    if (typeof me === "number") return new Response("nope", { status: me });
    return new Response(JSON.stringify(me), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
}

const ONE_PUB = { id: 7, handle: "ana", name: "Ana", primary_publication: { id: 1, subdomain: "anapost", name: "Ana Post" } };
const THREE_PUBS = {
  id: 7,
  handle: "ana",
  primary_publication: { subdomain: "anapost", name: "Ana Post" },
  publicationUsers: [
    { publication: { subdomain: "anapost", name: "Ana Post" } },
    { publication: { subdomain: "perros", name: "Perros" } },
    { publication: { subdomain: "otra", name: null } },
  ],
};

/** La forma real que devuelve Substack hoy: camelCase y con el rol en cada publicación. */
const REAL = {
  id: 7,
  handle: "ana",
  primaryPublication: { id: 9, subdomain: "anapost", name: "Nombre Bonito" },
  publicationUsers: [
    { role: "admin", publication: { id: 9, subdomain: "anapost", name: "Nombre Bonito" } },
    { role: "admin", publication: { id: 10, subdomain: "perros", name: "Perros" } },
    { role: "contributor", publication: { id: 11, subdomain: "ajena", name: "Ajena" } },
  ],
};

describe("extractPublications", () => {
  it("junta y deduplica las publicaciones vengan en la forma que vengan", () => {
    expect(extractPublications(THREE_PUBS).map((p) => p.subdomain)).toEqual(["anapost", "perros", "otra"]);
    expect(extractPublications(ONE_PUB)).toEqual([{ id: 1, subdomain: "anapost", name: "Ana Post", primary: true }]);
    expect(extractPublications({ id: 1 })).toEqual([]);
  });

  it("lee `primaryPublication` en camelCase, que es la clave que devuelve Substack", () => {
    // Solo se miraba `primary_publication`, así que la principal nunca se reconocía como tal y la
    // detección dependía sin saberlo de que `publicationUsers` trajera subdominios.
    const pubs = extractPublications(REAL);
    expect(pubs.find((p) => p.primary)?.subdomain).toBe("anapost");
  });

  it("descarta las publicaciones donde no es admin", () => {
    // Colaborar o estar suscrito no da acceso a las estadísticas; ofrecerla solo confunde.
    expect(extractPublications(REAL).map((p) => p.subdomain)).toEqual(["anapost", "perros"]);
  });

  it("el nombre de la publicación no dice nada del subdominio", () => {
    // El fallo que motivó esto: «Objeto Brillante» vive en `sotoplatero.substack.com`.
    const pub = extractPublications(REAL).find((p) => p.primary)!;
    expect(pub.name).toBe("Nombre Bonito");
    expect(pub.subdomain).toBe("anapost");
  });
});

describe("verifySession", () => {
  it("devuelve la identidad con una sesión válida", async () => {
    const id = await verifySession(COOKIE, fakeApi(ONE_PUB));
    expect(id).toMatchObject({ user_id: 7, handle: "ana" });
  });

  it("distingue sesión caducada de fallo de red", async () => {
    await expect(verifySession(COOKIE, fakeApi(403))).rejects.toBeInstanceOf(NotConnectedError);
    await expect(verifySession(COOKIE, fakeApi(500))).rejects.toThrow(/HTTP 500/);
  });

  it("trata el HTML de login como sesión inválida, no como JSON roto", async () => {
    const html = (async () => new Response("<!doctype html><html>sign in</html>", { status: 200 })) as unknown as typeof fetch;
    await expect(verifySession(COOKIE, html)).rejects.toBeInstanceOf(NotConnectedError);
  });
});

describe("connect", () => {
  let home: string;
  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "stackchat-home-"));
    process.env.STACKCHAT_HOME = home;
  });
  afterEach(() => {
    delete process.env.STACKCHAT_HOME;
    rmSync(home, { recursive: true, force: true });
  });

  it("con una sola publicación guarda config y cookie", async () => {
    const r = await connect(COOKIE, { fetchImpl: fakeApi(ONE_PUB) });
    expect(r.config).toMatchObject({ subdomain: "anapost", user_id: 7, publication_name: "Ana Post" });
    expect(loadConfig()?.subdomain).toBe("anapost");
    expect(JSON.parse(readFileSync(authPath(), "utf8")).cookie).toBe(COOKIE);
  });

  it("con varias publicaciones NO escribe nada y pide elegir", async () => {
    const r = await connect(COOKIE, { fetchImpl: fakeApi(THREE_PUBS) });
    expect(r.config).toBeNull();
    expect(r.needsChoice.map((p) => p.subdomain)).toEqual(["anapost", "perros", "otra"]);
    expect(existsSync(configPath())).toBe(false);
    expect(existsSync(authPath())).toBe(false);
  });

  it("con --sub elige sin ambigüedad", async () => {
    const r = await connect(COOKIE, { subdomain: "perros", fetchImpl: fakeApi(THREE_PUBS) });
    expect(r.config?.subdomain).toBe("perros");
  });

  it("una sesión inválida no deja nada escrito", async () => {
    await expect(connect(COOKIE, { fetchImpl: fakeApi(401) })).rejects.toBeInstanceOf(NotConnectedError);
    expect(existsSync(configPath())).toBe(false);
    expect(existsSync(authPath())).toBe(false);
  });
});

describe("paths", () => {
  it("STACKCHAT_HOME manda, y `:memory:` no se convierte en ruta", () => {
    // Ruta absoluta del sistema en curso: una fija de Windows no lo es en Linux, y `resolve`
    // le antepondría el cwd. Lo cazó CI antes que yo.
    const raiz = join(tmpdir(), "stackchat-paths-x");
    process.env.STACKCHAT_HOME = raiz;
    expect(stackchatHome()).toBe(raiz);
    expect(dbPath(":memory:")).toBe(":memory:");
    expect(dbPath()).toBe(join(raiz, "stackchat.db"));
    delete process.env.STACKCHAT_HOME;
  });
});
