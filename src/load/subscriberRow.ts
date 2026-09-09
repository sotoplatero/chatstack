import { normDate, toBool, toInt, type Row } from "./csv.js";

/** Forma común de un contacto, independiente del formato del CSV de origen. */
export interface SubscriberRow {
  email: string;
  createdAt: string | null;
  plan: string;
  isActive: number;
  paidSince: string | null;
  unsubscribedAt: string | null;
  source: string | null;
  extra: Record<string, unknown>;
}

const LEGACY_USED = ["email", "active_subscription", "plan", "email_disabled", "created_at", "first_payment_at", "expiry"];

/** Formato legado: email, active_subscription, expiry, plan, email_disabled, created_at, first_payment_at. */
function fromLegacy(row: Row): SubscriberRow {
  const active = toBool(row.active_subscription);
  const raw = (row.plan ?? "").trim().toLowerCase();
  const isActive = toBool(row.email_disabled) ? 0 : 1;
  let plan = "free";
  if (active) plan = raw === "" || raw === "other" ? "paid" : raw;
  else if (raw === "comp" || raw === "gift" || raw === "founding") plan = raw;
  return {
    email: row.email,
    createdAt: normDate(row.created_at),
    plan,
    isActive,
    paidSince: normDate(row.first_payment_at),
    unsubscribedAt: null,
    source: null,
    extra: pick(row, LEGACY_USED, { raw_plan: row.plan, expiry: row.expiry, first_payment_at: row.first_payment_at }),
  };
}

/**
 * Formato actual (Audiencia → Exportar, todas las columnas): Email, Name, Stripe plan, Cancel date, Start date,
 * Paid upgrade date, …, Activity, Type, … Trae engagement por contacto; se normaliza a claves estables en `extra`.
 */
function fromCurrent(row: Row): SubscriberRow {
  const type = (row["Type"] ?? "").trim().toLowerCase();
  const stripe = (row["Stripe plan"] ?? "").trim().toLowerCase();
  let plan: string;
  if (type === "" || type === "free") plan = "free";
  else if (type === "author" || type === "comp" || type === "gift" || type === "founding") plan = type;
  else if (/month/.test(stripe)) plan = "monthly";
  else if (/year|annual/.test(stripe)) plan = "yearly";
  else plan = type; // "paid" u otros valores que Substack añada
  const cancel = normDate(row["Cancel date"]);
  const paidSince = normDate(row["Paid upgrade date"]) ?? normDate(row["First paid date"]);
  const used = ["Email", "Type", "Stripe plan", "Cancel date", "Start date", "Paid upgrade date", "First paid date", "Subscription source (free)"];
  return {
    email: row["Email"],
    createdAt: normDate(row["Start date"]),
    plan,
    isActive: cancel ? 0 : 1,
    paidSince,
    unsubscribedAt: cancel,
    source: emptyToNull(row["Subscription source (free)"]),
    extra: pick(row, used, {
      name: emptyToNull(row["Name"]),
      raw_type: row["Type"],
      stripe_plan: emptyToNull(row["Stripe plan"]),
      activity: toInt(row["Activity"]),
      emails_received_6mo: toInt(row["Emails received (6mo)"]),
      emails_opened_6mo: toInt(row["Emails opened (6mo)"]),
      emails_opened_7d: toInt(row["Emails opened (7d)"]),
      emails_opened_30d: toInt(row["Emails opened (30d)"]),
      last_email_open: normDate(row["Last email open"]),
      links_clicked: toInt(row["Links clicked"]),
      last_clicked_at: normDate(row["Last clicked at"]),
      post_views: toInt(row["Post views"]),
      post_views_30d: toInt(row["Post views (30d)"]),
      comments: toInt(row["Comments"]),
      shares: toInt(row["Shares"]),
      days_active_30d: toInt(row["Days active (30d)"]),
      revenue: emptyToNull(row["Revenue"]),
      source_paid: emptyToNull(row["Subscription source (paid)"]),
      country: emptyToNull(row["Country"]),
      state: emptyToNull(row["State/Province"]),
      bestseller: emptyToNull(row["Bestseller"]),
      expiration_date: emptyToNull(row["Expiration date"]),
    }),
  };
}

export function normalizeSubscriberRow(row: Row): SubscriberRow | null {
  const r = "active_subscription" in row ? fromLegacy(row) : "Email" in row ? fromCurrent(row) : null;
  if (!r) return null;
  r.email = (r.email ?? "").trim().toLowerCase();
  return r.email ? r : null;
}

/** Devuelve `known` (sin nulos) más toda columna no consumida, para no perder nada si Substack añade campos. */
function pick(row: Row, used: string[], known: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(known)) if (v !== null && v !== undefined && v !== "") out[k] = v;
  const consumed = new Set([...used, ...KNOWN_SOURCE_COLUMNS]);
  for (const [k, v] of Object.entries(row)) if (!consumed.has(k) && v !== "") out[k] = v;
  return out;
}

const KNOWN_SOURCE_COLUMNS = [
  "Name", "Activity", "Emails received (6mo)", "Emails opened (6mo)", "Emails opened (7d)", "Emails opened (30d)",
  "Last email open", "Links clicked", "Last clicked at", "Post views", "Post views (30d)", "Comments", "Shares",
  "Days active (30d)", "Revenue", "Subscription source (paid)", "Country", "State/Province", "Bestseller", "Expiration date",
];

function emptyToNull(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  return s ? s : null;
}
