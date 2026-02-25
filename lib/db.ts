import Database from "better-sqlite3";
import path from "path";
import type { Review, CreateReviewInput, ReviewStatus } from "@/types";

const DB_PATH = path.join(process.cwd(), "data", "reviews.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  const fs = require("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_reviews_brand   ON reviews(brand);
    CREATE INDEX IF NOT EXISTS idx_reviews_status  ON reviews(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_google_id ON reviews(google_id);
  `);

  return _db;
}

// ── Read ────────────────────────────────────────────────────────────────────

export function getAllReviews(brand?: string): Review[] {
  const db = getDb();
  if (brand) {
    return db
      .prepare("SELECT * FROM reviews WHERE brand = ? ORDER BY created_at DESC")
      .all(brand) as Review[];
  }
  return db
    .prepare("SELECT * FROM reviews ORDER BY created_at DESC")
    .all() as Review[];
}

export function getReviewById(id: number): Review | undefined {
  return getDb()
    .prepare("SELECT * FROM reviews WHERE id = ?")
    .get(id) as Review | undefined;
}

/** Returns real responses (not null/empty) for style learning */
export function getTrainingResponses(limit = 40): Pick<Review, "content" | "rating" | "response">[] {
  return getDb()
    .prepare(
      `SELECT content, rating, response FROM reviews
       WHERE response IS NOT NULL AND response != ''
       ORDER BY updated_at DESC
       LIMIT ?`
    )
    .all(limit) as Pick<Review, "content" | "rating" | "response">[];
}

// ── Write ───────────────────────────────────────────────────────────────────

export function createReview(input: CreateReviewInput): Review {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO reviews (brand, author, rating, content, review_date, google_id)
    VALUES (@brand, @author, @rating, @content, @review_date, @google_id)
  `);
  const info = stmt.run({
    brand: input.brand,
    author: input.author ?? "Anonyme",
    rating: input.rating,
    content: input.content,
    review_date: input.review_date ?? null,
    google_id: input.google_id ?? null,
  });
  return getReviewById(info.lastInsertRowid as number)!;
}

export function updateResponse(id: number, response: string): Review | undefined {
  const db = getDb();
  db.prepare(`
    UPDATE reviews
    SET response = ?, status = 'to_validate', updated_at = datetime('now')
    WHERE id = ?
  `).run(response, id);
  return getReviewById(id);
}

export function updateStatus(id: number, status: ReviewStatus): Review | undefined {
  const db = getDb();
  db.prepare(`
    UPDATE reviews
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, id);
  return getReviewById(id);
}

export function deleteReview(id: number): void {
  getDb().prepare("DELETE FROM reviews WHERE id = ?").run(id);
}

/** Upsert: inserts or skips if google_id already exists */
export function upsertReview(input: CreateReviewInput & { google_id: string }): { inserted: boolean; review: Review } {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM reviews WHERE google_id = ?")
    .get(input.google_id) as Review | undefined;

  if (existing) return { inserted: false, review: existing };

  const review = createReview(input);
  return { inserted: true, review };
}
