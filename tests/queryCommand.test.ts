import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, type Db } from "../src/db/index.js";
import { loadDirectory } from "../src/load/index.js";
import { parseFlags, runQuery, QUERY_NAMES, UsageError, helpText } from "../src/queryCommand.js";

const EMAIL_LIST = `Email,Name,Stripe plan,Cancel date,Start date,Paid upgrade date,Activity,Type,Subscription source (free)
ana@x.com,Ana,,,2025-01-01T00:00:00.000Z,,5,Free,substack-notes
bob@x.com,Bob,Monthly,,2025-02-01T00:00:00.000Z,2025-03-01T00:00:00.000Z,3,Paid,direct
`;

describe("parseFlags", () => {
  it("acepta --flag valor, --flag=valor y booleanos", () => {
    expect(parseFlags(["--limit", "10", "--kind=reply", "--active"])).toEqual({ limit: "10", kind: "reply", active: true });
    expect(parseFlags([])).toEqual({});
  });
  it("rechaza tokens sueltos para que un argumento mal puesto no se ignore", () => {
    expect(() => parseFlags(["basura"])).toThrow(UsageError);
    expect(() => parseFlags(["--limit", "10", "basura"])).toThrow(/inesperado/);
  });
});

describe("runQuery", () => {
  let db: Db;
  beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), "stackchat-qc-"));
    writeFileSync(join(dir, "email_list.csv"), EMAIL_LIST);
    db = openDb(":memory:");
    loadDirectory(db, dir);
  });

  it("cada consulta declarada se ejecuta y devuelve algo serializable", () => {
    for (const name of QUERY_NAMES) {
      // Las que exigen un argumento se prueban aparte; aquí van las que corren sin flags.
      if (name === "subscriber" || name === "note") continue;
      const out = runQuery(db, name, {});
      expect(out, name).toBeDefined();
      expect(() => JSON.stringify(out), name).not.toThrow();
    }
  });

  it("filtra suscriptores por plan y actividad", () => {
    const paid = runQuery(db, "subscribers", { plan: "paid" }) as any;
    expect(paid.total).toBe(1);
    expect(paid.rows[0].email).toBe("bob@x.com");
    const free = runQuery(db, "subscribers", { plan: "free", active: "true", limit: "1" }) as any;
    expect(free.rows[0].email).toBe("ana@x.com");
    expect(free.limit).toBe(1);
  });

  it("busca un contacto por email y avisa si no existe", () => {
    expect((runQuery(db, "subscriber", { email: "ANA@x.com" }) as any).plan).toBe("free");
    expect(runQuery(db, "subscriber", { email: "nadie@x.com" })).toMatchObject({ error: expect.stringContaining("No existe") });
    expect(() => runQuery(db, "subscriber", {})).toThrow(/--email/);
  });

  it("una consulta desconocida lista las disponibles en vez de fallar a secas", () => {
    try {
      runQuery(db, "suscriptores", {});
      expect.unreachable("debería haber lanzado");
    } catch (e) {
      expect(e).toBeInstanceOf(UsageError);
      expect((e as Error).message).toContain("suscriptores");
      expect((e as Error).message).toContain("subscribers");
    }
  });

  it("rechaza valores fuera de la lista cerrada y enteros mal formados", () => {
    expect(() => runQuery(db, "posts", { sort: "opens" })).toThrow(/debe ser uno de/);
    expect(() => runQuery(db, "notes", { sort: "likes" })).toThrow(/debe ser uno de/);
    expect(() => runQuery(db, "candidates", { limit: "muchos" })).toThrow(/entero/);
    expect(() => runQuery(db, "subscribers", { plan: true })).toThrow(/necesita un valor/);
    expect(() => runQuery(db, "note", {})).toThrow(/--id/);
  });

  it("la ayuda nombra todas las consultas", () => {
    const h = helpText();
    for (const name of QUERY_NAMES) expect(h).toContain(name);
  });
});
