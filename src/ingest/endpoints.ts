/**
 * Única lista de endpoints del panel de Substack. La importan tanto la ingesta por Node
 * (`src/ingest/`) como el generador de los snippets de navegador (`scripts/build-browser.mjs`),
 * para que no existan dos listas que se desincronicen cuando Substack cambie algo.
 *
 * Todos son rutas relativas: las de `PUB` cuelgan de `https://<sub>.substack.com`, las de
 * `SOCIAL` de `https://substack.com` (Notes vive ahí, y CORS impide llamarlas desde el subdominio).
 */

export const EMAIL_STATS_COLUMNS = [
  "title",
  "post_date",
  "audience",
  "views",
  "engagement_rate",
  "signups",
  "subscribes",
  "estimated_value",
  "open_rate",
] as const;

/** Columnas del export "todas las columnas" de Audiencia → Exportar (trae engagement por contacto). */
export const SUBSCRIBER_EXPORT_COLUMNS = [
  "user_email_address", "user_name", "subscription_type", "activity_rating", "subscription_created_at",
  "total_revenue_generated", "num_comments", "num_comments_last_7d", "num_comments_last_30d", "num_shares",
  "num_shares_last_7d", "num_shares_last_30d", "country", "state", "num_emails_received", "num_emails_dropped",
  "num_emails_opened", "num_email_opens", "num_email_opens_last_7d", "num_email_opens_last_30d", "last_opened_at",
  "links_clicked", "last_clicked_at", "num_unique_email_posts_seen", "num_unique_email_posts_seen_last_7d",
  "num_unique_email_posts_seen_last_30d", "num_web_post_views", "num_web_post_views_last_7d",
  "num_web_post_views_last_30d", "num_unique_web_posts_seen", "num_unique_web_posts_seen_last_7d",
  "num_unique_web_posts_seen_last_30d", "num_subs_gifted", "subscription_expires_at", "free_attribution",
  "paid_attribution", "days_active_last_30d", "first_payment_at", "last_subscribed_at", "unsubscribed_at",
  "emails_enabled", "bestseller_tier", "stripe_plan_name", "group_membership",
] as const;

export const SUBSCRIBER_SET_QUERY = { order_by_desc_nulls_last: "subscription_created_at" } as const;

/** Rutas en `https://<sub>.substack.com`. */
export const PUB = {
  emailStats: () =>
    `/api/v1/publication/stats/email_stats?format=csv&${EMAIL_STATS_COLUMNS.map((c) => `columns%5B%5D=${c}`).join("&")}`,
  traffic: (from: string, to: string) =>
    `/api/v1/publication/stats/publication_traffic/timeseries?from=${from}&to=${to}&format=csv`,
  growthSources: (from: string, to: string) =>
    `/api/v1/publication/stats/growth/sources?from_date=${from}&to_date=${to}&format=csv`,
  paidSubscriberGrowth: (from: string, to: string) =>
    `/api/v1/publication/stats/paid_subscriber_growth?start=${from}&end=${to}&period=day&format=csv`,
  subscriberTotals: (from: string) =>
    `/api/v1/publication/stats/emails/timeseries?from=${from}T00:00:00.000Z&format=csv&resolution=day`,
  archive: (offset: number, limit = 50) => `/api/v1/archive?sort=new&limit=${limit}&offset=${offset}`,
  subscriberSet: () => `/api/v1/subscriber_set`,
  subscriberExport: () => `/api/v1/subscriber_set/export`,
  subscriberExportStatus: (id: string) => `/api/v1/subscriber_set/export/${id}`,
  /**
   * Lista de suscriptores en JSON, la que alimenta la tabla del panel. Sin descarga y sin CORS,
   * que es lo que la hace utilizable desde la propia pagina. `POST` con `{ limit, offset }`.
   * Trae menos columnas que el export en CSV: ni aperturas, ni clics, ni dias activos.
   */
  subscriberStats: () => `/api/v1/subscriber-stats`,
} as const;

/** Tope por pagina de `subscriberStats`: con 150 responde 400. Comprobado contra el panel real. */
export const SUBSCRIBER_STATS_PAGE = 100;

/** Rutas en `https://substack.com` (perfil, Notes e interacciones). */
export const SOCIAL = {
  self: () => `/api/v1/user/profile/self`,
  publicProfile: (handleOrId: string | number) => `/api/v1/user/${handleOrId}/public_profile`,
  profileFeed: (userId: number, cursor = "") =>
    `/api/v1/reader/feed/profile/${userId}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
  reactors: (noteId: number) => `/api/v1/comment/${noteId}/reactors`,
  restackers: (noteId: number) => `/api/v1/comment/${noteId}/restackers`,
  replies: (noteId: number, cursor = "") =>
    `/api/v1/reader/comment/${noteId}/replies${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
  noteStats: (noteId: number) => `/api/v1/note_stats/c-${noteId}`,
} as const;

export const SOCIAL_ORIGIN = "https://substack.com";
export const pubOrigin = (subdomain: string) => `https://${subdomain}.substack.com`;

/** Ventana por defecto de las series. Substack agrega por mes si el rango es muy amplio. */
export const DEFAULT_FROM = "2024-01-01";
export const today = () => new Date().toISOString().slice(0, 10);

/** Pares [desde, hasta] de `days` días que cubren [from, to], para no perder el detalle diario. */
export function dateChunks(from: string, to: string, days: number): [string, string][] {
  const out: [string, string][] = [];
  let a = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (a <= end) {
    const b = new Date(Math.min(a.getTime() + (days - 1) * 86_400_000, end.getTime()));
    out.push([a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]);
    a = new Date(b.getTime() + 86_400_000);
  }
  return out;
}
