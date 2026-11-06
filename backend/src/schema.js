// Table definitions. DDL branches only on the auto-increment id type;
// everything else (TEXT timestamps, INTEGER flags, JSON stored as TEXT)
// is identical across SQLite and Postgres.
const { exec, usePg } = require('./db');

const ID = () =>
  usePg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

async function initSchema() {
  await exec(`CREATE TABLE IF NOT EXISTS users (
    id ${ID()},
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    major TEXT NOT NULL DEFAULT '',
    grad_year TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#B31B1B',
    created_at TEXT NOT NULL
  )`);

  await exec(`CREATE TABLE IF NOT EXISTS listings (
    id ${ID()},
    title TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    address_label TEXT NOT NULL,
    price_per_bedroom INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    distance_min INTEGER NOT NULL,
    furnished INTEGER NOT NULL DEFAULT 0,
    utilities_included INTEGER NOT NULL DEFAULT 0,
    available_from TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    amenities TEXT NOT NULL DEFAULT '[]',
    landlord_label TEXT NOT NULL DEFAULT '',
    posted_by INTEGER,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);

  await exec(`CREATE TABLE IF NOT EXISTS bookmarks (
    id ${ID()},
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (user_id, listing_id)
  )`);

  await exec(`CREATE TABLE IF NOT EXISTS questionnaires (
    user_id INTEGER PRIMARY KEY,
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    neighborhoods TEXT NOT NULL DEFAULT '[]',
    move_in TEXT NOT NULL,
    bedrooms_needed INTEGER NOT NULL,
    sleep_schedule TEXT NOT NULL,
    cleanliness INTEGER NOT NULL,
    guests TEXT NOT NULL,
    smoking TEXT NOT NULL,
    study_habits TEXT NOT NULL,
    noise_tolerance INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  await exec(`CREATE TABLE IF NOT EXISTS roommate_requests (
    id ${ID()},
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    UNIQUE (from_user_id, to_user_id)
  )`);

  await exec(`CREATE TABLE IF NOT EXISTS landlord_reviews (
    id ${ID()},
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    landlord_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`);
}

module.exports = { initSchema };
