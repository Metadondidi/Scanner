/**
 * npm run db:init
 * Initializes the SQLite database manually (useful for first-run checks).
 * The DB is also auto-created on first API call.
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "..", "data", "reviews.db");
const dir = path.dirname(DB_PATH);

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    brand       TEXT NOT NULL CHECK(brand IN ('green', 'red')),
    author      TEXT NOT NULL DEFAULT 'Anonyme',
    rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    content     TEXT NOT NULL,
    review_date TEXT,
    response    TEXT,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('pending', 'to_validate', 'published', 'rejected')),
    google_id   TEXT UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_brand     ON reviews(brand);
  CREATE INDEX IF NOT EXISTS idx_reviews_status    ON reviews(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_google_id ON reviews(google_id);
`);

db.close();
console.log("✅ Base de données initialisée :", DB_PATH);
