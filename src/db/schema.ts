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
