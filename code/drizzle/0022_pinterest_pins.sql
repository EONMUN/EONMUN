CREATE TABLE pinterest_artwork_pins (
 artwork_id INTEGER PRIMARY KEY REFERENCES artworks(id) ON DELETE CASCADE,
 board_id TEXT NOT NULL,
 pin_id TEXT,
 state TEXT NOT NULL CHECK (state IN ('checking', 'posting', 'published')),
 created_at INTEGER NOT NULL
);
