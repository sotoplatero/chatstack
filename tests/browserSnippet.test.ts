import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Script, createContext } from "node:vm";

/**
 * Los snippets del navegador se generan y nadie los ejecuta hasta que un usuario los pega en su
 * pestaña. Hoy llegaron a main dos fallos que solo se ven ejecutandolos: un salto de linea sin
 * escapar que impedia compilar, y una `const` fuera de su bloque que reventaba en la fase de
 * suscriptores. Esto los ejecuta en seco, con un `fetch` simulado, hasta `listo: true`.
 */
const DIR = join(__dirname, "..", "skills", "stackchat", "browser");
const leer = (f: string) => readFileSync(join(DIR, f), "utf8");

const ok = (x: unknown) => ({ ok: true, status: 200, json: async () => x, text: async () => x });

function fetchSimulado(u: string) {
  if (u.includes("subscriber_set/export/")) return ok({ url: "/api/v1/subscriber_set/export/ID/file" });
  if (u.includes("subscriber_set/export")) return ok({ export_id: "ID" });
  if (u.includes("subscriber_set")) return ok({ id: 1 });
  if (u.includes("subscriber-stats")) {
    return ok({
      count: 2,
      subscribers: [
        { user_email_address: "a@b.c", user_name: 'Ana, "la" Buena', subscription_type: null, subscription_interval: "free",
          subscription_created_at: "2026-01-01T00:00:00Z", activity_rating: 3, total_revenue_generated: 0 },
        { user_email_address: "p@b.c", user_name: "Pago", subscription_type: "paid", subscription_interval: "annual",
          subscription_created_at: "2025-06-01T00:00:00Z", activity_rating: 5, total_revenue_generated: 120 },
      ],
    });
  }
  if (u.includes("/archive")) return ok([]);
  if (u.endsWith("/file")) throw new TypeError("Failed to fetch"); // CORS, como en Chrome
  return ok("date,views\n2026-01-01,1\n");
}

async function ejecutar(nombre: string, fetchImpl: (u: string) => unknown, ms = 4000) {
  const sandbox: Record<string, unknown> = {
    window: {}, location: { origin: "https://x.substack.com" },
    fetch: async (u: string) => fetchImpl(u), setTimeout, clearTimeout, console, JSON, Array, Object, Promise, String, Number, Date, TypeError, Error, Math,
  };
  const ctx = createContext(sandbox);
  new Script(leer(nombre), { filename: nombre }).runInContext(ctx);
  const P = () => (sandbox.window as { __stackchat: Record<string, unknown> }).__stackchat;
  const t0 = Date.now();
  while (!P().listo && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 50));
  return P();
}

describe("snippets del navegador, ejecutados en seco", () => {
  it("01-publication llega a `terminado` y emite email_list.csv con las cabeceras del export", async () => {
    const P = await ejecutar("01-publication.js", fetchSimulado);
    expect(P.error).toBeNull();
    expect(P.listo).toBe(true);
    expect(P.fase).toBe("terminado");
    const datos = P.datos as { files: Record<string, string>; email_list_url: string };
    const csv = datos.files["email_list.csv"];
    expect(csv.split("\n")[0]).toBe("Email,Name,Type,Stripe plan,Start date,Activity,Revenue");
    // Comas y comillas en el nombre quedan entrecomilladas: si no, el CSV se rompe.
    expect(csv).toContain('"Ana, ""la"" Buena"');
    expect(csv).toContain("p@b.c,Pago,paid,annual,");
    // La version en texto es exactamente el objeto serializado: asi se saca por trozos.
    expect(P.json).toBe(JSON.stringify(P.datos));
    expect(P.jsonLength).toBe((P.json as string).length);
    // El resultado del tool se trunca a ~1 KB: el JSON sale por una unica descarga.
    expect(typeof P.descargar).toBe("function");
    expect(datos.email_list_url).toBe("https://x.substack.com/api/v1/subscriber_set/export/ID/file");
  });

  it("02-notes compila y arranca sin error sincrono", async () => {
    // Su flujo completo necesita medio Substack simulado; aqui basta con que arranque y marque su paso.
    const P = await ejecutar("02-notes.js", () => ok({}), 300);
    expect(P.paso).toBe("notes");
  });
});
