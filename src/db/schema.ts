export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  raw_dir TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS raw_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  row_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'substack',
  first_seen_at TEXT NOT NULL,
  subscribed_at TEXT,
  source TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_since TEXT,
  unsubscribed_at TEXT,
  last_synced_run_id INTEGER REFERENCES sync_runs(id),
  extra TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_subscribers_plan ON subscribers(plan, is_active);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed_at ON subscribers(subscribed_at);

CREATE TABLE IF NOT EXISTS subscriber_snapshots (
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  email TEXT NOT NULL,
  is_active INTEGER NOT NULL,
  plan TEXT NOT NULL,
  extra TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (run_id, email)
);
-- churn compara cada snapshot con el siguiente del mismo contacto. Sin este índice esa
-- comparación recorre la tabla entera por cada fila.
CREATE INDEX IF NOT EXISTS idx_snapshots_email ON subscriber_snapshots(email, run_id);

CREATE TABLE IF NOT EXISTS posts (
  post_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'substack',
  title TEXT,
  subtitle TEXT,
  post_date TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  email_sent_at TEXT,
  type TEXT,
  audience TEXT,
  slug TEXT,
  wordcount INTEGER,
  last_synced_run_id INTEGER REFERENCES sync_runs(id),
  extra TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_posts_post_date ON posts(post_date);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title);

CREATE TABLE IF NOT EXISTS post_email_stats (
  post_id TEXT NOT NULL,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  title TEXT,
  post_date TEXT,
  audience TEXT,
  views INTEGER,
  engagement_rate REAL,
  signups INTEGER,
  subscribes INTEGER,
  estimated_value REAL,
  open_rate REAL,
  sent INTEGER,
  delivered INTEGER,
  opens INTEGER,
  opened INTEGER,
  clicks INTEGER,
  clicked INTEGER,
  click_rate REAL,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  restacks INTEGER,
  unsubscribes INTEGER,
  finished_post INTEGER,
  extra TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (post_id, run_id)
);

CREATE TABLE IF NOT EXISTS growth_sources (
  date TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  new_revenue REAL NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (date, source)
);

CREATE TABLE IF NOT EXISTS traffic (
  date TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

CREATE TABLE IF NOT EXISTS subscriber_totals (
  date TEXT PRIMARY KEY,
  total_subscribers INTEGER NOT NULL,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

CREATE TABLE IF NOT EXISTS notes (
  note_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT,
  body TEXT,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  restacks INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  attachments TEXT NOT NULL DEFAULT '[]',
  stats TEXT,
  stats_updated_at TEXT,
  last_synced_run_id INTEGER REFERENCES sync_runs(id)
);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);

CREATE TABLE IF NOT EXISTS note_actors (
  user_id INTEGER PRIMARY KEY,
  name TEXT,
  handle TEXT,
  photo_url TEXT,
  publication_subdomain TEXT,
  publication_name TEXT,
  is_subscribed INTEGER,
  is_following INTEGER,
  bestseller_tier INTEGER,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_interactions (
  note_id INTEGER NOT NULL REFERENCES notes(note_id),
  actor_user_id INTEGER NOT NULL REFERENCES note_actors(user_id),
  kind TEXT NOT NULL CHECK (kind IN ('like','restack','reply')),
  reply_id INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  body TEXT,
  reaction_count INTEGER,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (note_id, actor_user_id, kind, reply_id)
);
CREATE INDEX IF NOT EXISTS idx_note_interactions_actor ON note_interactions(actor_user_id);

-- Serie diaria de seguidores: gente que sigue la publicación sin estar suscrita.
CREATE TABLE IF NOT EXISTS followers_daily (
  date TEXT PRIMARY KEY,
  followers INTEGER NOT NULL,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

-- Bajas con su fecha real, tal como las lista el panel. subscribers.unsubscribed_at solo tiene
-- fecha fiable para quien sigue apareciendo en el export; esta tabla no depende de eso.
CREATE TABLE IF NOT EXISTS unsubscribes (
  email TEXT NOT NULL,
  unsubscribed_at TEXT,
  subscribed_at TEXT,
  plan TEXT,
  source TEXT,
  name TEXT,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (email, unsubscribed_at)
);

-- Fuentes de visita del rango completo, con altas por fuente. Es una foto, no una serie:
-- cada sync la reemplaza entera.
CREATE TABLE IF NOT EXISTS visitor_sources (
  source TEXT PRIMARY KEY,
  category TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  free_signups INTEGER NOT NULL DEFAULT 0,
  subscribed INTEGER NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

-- Cuánto de la audiencia llega por la red de Substack y cuánto de fuera.
CREATE TABLE IF NOT EXISTS network_attribution (
  label TEXT NOT NULL,
  time_window TEXT NOT NULL,
  subscribers INTEGER NOT NULL DEFAULT 0,
  pct_of_total REAL,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (label, time_window)
);

CREATE TABLE IF NOT EXISTS audience_location (
  location TEXT NOT NULL,
  metric TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id),
  PRIMARY KEY (location, metric)
);

-- Publicaciones que comparten audiencia contigo: candidatas a recomendación cruzada.
CREATE TABLE IF NOT EXISTS audience_overlap (
  subdomain TEXT PRIMARY KEY,
  name TEXT,
  author TEXT,
  percent_overlap REAL NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

-- Quién te trae lectores.
CREATE TABLE IF NOT EXISTS referrers (
  user_id TEXT PRIMARY KEY,
  name TEXT,
  handle TEXT,
  visitors INTEGER NOT NULL DEFAULT 0,
  free_subscribers INTEGER NOT NULL DEFAULT 0,
  paid_subscribers INTEGER NOT NULL DEFAULT 0,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

-- Las cifras sueltas del panel (retención, referidos, apertura y visitas de 30 días) en
-- clave/valor, para no inventar una tabla por número.
CREATE TABLE IF NOT EXISTS pub_summary (
  metric TEXT PRIMARY KEY,
  value TEXT,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);

CREATE TABLE IF NOT EXISTS subscriber_growth_daily (
  date TEXT PRIMARY KEY,
  new_free INTEGER,
  unsubscribes INTEGER,
  new_paid INTEGER,
  upgrades INTEGER,
  trials_started INTEGER,
  cancellations_initiated INTEGER,
  cancellations_finalized INTEGER,
  run_id INTEGER NOT NULL REFERENCES sync_runs(id)
);
`;
