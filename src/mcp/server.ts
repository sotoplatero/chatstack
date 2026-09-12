import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { Db } from "../db/index.js";
import * as q from "../queries.js";

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] };
}

function safe<T>(fn: () => T) {
  try {
    return json(fn());
  } catch (e) {
    return { content: [{ type: "text" as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
  }
}

export function buildServer(db: Db): McpServer {
  const server = new McpServer({ name: "stackchat", version: "0.1.0" });

  server.registerTool(
    "get_overview",
    {
      title: "Resumen de la publicación",
      description:
        "Totales actuales de suscriptores (activos, free, pago, inactivos), reparto por plan, altas en 30/90 días, totales diarios de crecimiento y fecha del último sync. Empieza por aquí.",
      inputSchema: {},
    },
    async () => safe(() => q.getOverview(db)),
  );

  server.registerTool(
    "list_subscribers",
    {
      title: "Listar suscriptores",
      description:
        "Lista contactos con filtros. plan: 'free', 'paid' (cualquier plan de pago), o uno concreto ('monthly','yearly','founding','comp'). Fechas en ISO (YYYY-MM-DD). Paginado con limit/offset.",
      inputSchema: {
        plan: z.string().optional(),
        is_active: z.boolean().optional(),
        subscribed_after: z.string().optional(),
        subscribed_before: z.string().optional(),
        email_contains: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async (args) => safe(() => q.listSubscribers(db, args)),
  );

  server.registerTool(
    "get_subscriber",
    {
      title: "Ficha de un suscriptor",
      description: "Devuelve el estado actual de un contacto por email y su historial de plan/actividad en cada sync.",
      inputSchema: { email: z.string() },
    },
    async ({ email }) => safe(() => q.getSubscriber(db, email) ?? { error: "No existe ese email en la base." }),
  );

  server.registerTool(
    "find_upgrade_candidates",
    {
      title: "Candidatos a pasar a pago",
      description:
        "Suscriptores free activos ordenados como candidatos a pago por engagement real del export de Substack: activity (0-5), emails abiertos en 30 días y días activos, con antigüedad como desempate. Cada fila trae en `extra` el detalle (aperturas 7d/30d/6mo, clicks, vistas, último email abierto, fuente). Si la BD solo tuviera el export legado sin engagement, `method` lo indica y el orden pasa a ser por antigüedad.",
      inputSchema: {
        limit: z.number().int().min(1).max(500).optional(),
        min_days_subscribed: z.number().int().min(0).optional(),
      },
    },
    async ({ limit, min_days_subscribed }) => safe(() => q.findUpgradeCandidates(db, limit ?? 50, min_days_subscribed ?? 14)),
  );

  server.registerTool(
    "get_post_performance",
    {
      title: "Rendimiento de posts",
      description:
        "Posts con sus métricas de email más recientes: views, open_rate, engagement_rate, signups (altas free generadas), subscribes (altas de pago generadas), estimated_value. Útil para saber qué contenido convierte.",
      inputSchema: {
        sort: z.enum(["open_rate", "views", "subscribes", "signups", "post_date"]).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      },
    },
    async ({ sort, limit }) => safe(() => q.getPostPerformance(db, sort ?? "post_date", limit ?? 50)),
  );

  server.registerTool(
    "get_growth",
    {
      title: "Crecimiento por periodo y fuente",
      description:
        "Altas por fuente de captación (growth_sources) y series diarias de free/paid (new_free, unsubscribes, new_paid, upgrades, cancellations) agrupadas por day/week/month o por source. Fechas YYYY-MM-DD.",
      inputSchema: {
        from: z.string().optional(),
        to: z.string().optional(),
        group_by: z.enum(["day", "week", "month", "source"]).optional(),
      },
    },
    async ({ from, to, group_by }) => safe(() => q.getGrowth(db, from, to, group_by ?? "month")),
  );

  server.registerTool(
    "get_churn",
    {
      title: "Bajas y cambios de plan",
      description:
        "Contactos dados de baja (desaparecidos del export entre syncs) y transiciones de plan detectadas comparando snapshots consecutivos (upgrades free→pago, downgrades pago→free). Requiere al menos dos syncs para tener transiciones.",
      inputSchema: { from: z.string().optional(), to: z.string().optional() },
    },
    async ({ from, to }) => safe(() => q.getChurn(db, from, to)),
  );

  server.registerTool(
    "get_notes_performance",
    {
      title: "Rendimiento de tus Notes",
      description:
        "Tus Notes (substack.com) con likes, restacks, respuestas, personas únicas que interactuaron y adjuntos. `has_stats` indica si Substack ya publicó impresiones para esa nota (tarda ~24h).",
      inputSchema: {
        sort: z.enum(["date", "reactions", "restacks", "replies", "interactions"]).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      },
    },
    async ({ sort, limit }) => safe(() => q.getNotesPerformance(db, sort ?? "interactions", limit ?? 50)),
  );

  server.registerTool(
    "get_note_engagers",
    {
      title: "Quién interactúa con tus Notes",
      description:
        "Personas ordenadas por interacciones con tus Notes (likes + restacks + respuestas), con su publicación, si te siguen, cuántas notas tocaron y `matched_subscriber_email` si su nombre coincide con un suscriptor (pista, no certeza: Substack no revela el email de quien da like). Filtra por `kind` para ver solo quién restackea o quién responde.",
      inputSchema: {
        limit: z.number().int().min(1).max(500).optional(),
        kind: z.enum(["like", "restack", "reply"]).optional(),
      },
    },
    async ({ limit, kind }) => safe(() => q.getNoteEngagers(db, limit ?? 30, kind)),
  );

  server.registerTool(
    "get_note",
    {
      title: "Detalle de una Note",
      description: "Una Note con su texto completo, adjuntos, stats (si las hay) y la lista de quién dio like, restackeó o respondió (con el texto de cada respuesta).",
      inputSchema: { note_id: z.number().int() },
    },
    async ({ note_id }) => safe(() => q.getNote(db, note_id) ?? { error: "No existe esa nota en la base." }),
  );

  server.registerTool(
    "get_schema",
    {
      title: "Esquema de la base de datos",
      description: "Tablas, DDL y número de filas. Úsalo antes de query_sql para escribir consultas correctas.",
      inputSchema: {},
    },
    async () => safe(() => q.getSchema(db)),
  );

  server.registerTool(
    "query_sql",
    {
      title: "Consulta SQL de solo lectura",
      description:
        "Ejecuta un SELECT (o WITH ... SELECT) sobre la base SQLite. Solo lectura, una sentencia, LIMIT 200 por defecto si no indicas uno. Para preguntas que las demás tools no cubren.",
      inputSchema: { sql: z.string(), max_rows: z.number().int().min(1).max(2000).optional() },
    },
    async ({ sql, max_rows }) => safe(() => q.querySql(db, sql, max_rows ?? 200)),
  );

  return server;
}

export async function serveStdio(db: Db) {
  const server = buildServer(db);
  await server.connect(new StdioServerTransport());
}
