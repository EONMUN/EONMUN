CREATE TABLE pinterest_connection (
 id INTEGER PRIMARY KEY CHECK (id = 1),
 tokens TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 refresh_until INTEGER NOT NULL DEFAULT 0,
 board_id TEXT,
 board_name TEXT,
 authorized_by TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE pinterest_oauth_states (
 state TEXT PRIMARY KEY,
 owner TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
