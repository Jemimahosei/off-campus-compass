const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { query, usePg } = require('./db');
const { initSchema } = require('./schema');
const { seed } = require('./seed');
const { signToken, authMiddleware, publicUser } = require('./auth');
const { scorePair } = require('./matching');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());

const now = () => new Date().toISOString();
const toInt = (v, dflt) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? dflt : n;
};
const boolOut = (v) => v === 1 || v === true;

function listingOut(row) {
  if (!row) return null;
  return {
    ...row,
    furnished: boolOut(row.furnished),
    utilities_included: boolOut(row.utilities_included),
    is_demo: boolOut(row.is_demo),
    amenities: safeJson(row.amenities, []),
  };
}
function safeJson(text, fallback) {
  try {
    return JSON.parse(text || '');
  } catch {
    return fallback;
  }
}
function questionnaireOut(row) {
  if (!row) return null;
  return { ...row, neighborhoods: safeJson(row.neighborhoods, []) };
}

// ---------- health ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, engine: usePg ? 'postgres' : 'sqlite' });
});

// ---------- auth ----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, major = '', grad_year = '', bio = '' } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const rows = await query(
      'INSERT INTO users (name, email, password_hash, major, grad_year, bio, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [name, email.toLowerCase(), hash, major, grad_year, bio, now()]
    );
    const user = (await query('SELECT * FROM users WHERE id = ?', [rows[0].id]))[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const rows = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const rows = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const q = await query('SELECT * FROM questionnaires WHERE user_id = ?', [req.user.id]);
  res.json({ user: publicUser(rows[0]), questionnaire: questionnaireOut(q[0]) || null });
});

// ---------- listings ----------
app.get('/api/listings', async (req, res) => {
  try {
    const { maxPrice, minPrice, bedrooms, neighborhood, furnished, utilities, availableFrom } = req.query;
    const conditions = [];
    const params = [];
    if (maxPrice !== undefined) { conditions.push('price_per_bedroom <= ?'); params.push(toInt(maxPrice, 100000)); }
    if (minPrice !== undefined) { conditions.push('price_per_bedroom >= ?'); params.push(toInt(minPrice, 0)); }
    if (bedrooms !== undefined) { conditions.push('bedrooms >= ?'); params.push(toInt(bedrooms, 1)); }
    if (neighborhood) { conditions.push('neighborhood = ?'); params.push(neighborhood); }
    if (furnished === 'true') { conditions.push('furnished = 1'); }
    if (utilities === 'true') { conditions.push('utilities_included = 1'); }
    if (availableFrom) { conditions.push('available_from <= ?'); params.push(availableFrom); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `SELECT * FROM listings ${where} ORDER BY price_per_bedroom ASC`,
      params
    );
    const neighborhoods = await query('SELECT DISTINCT neighborhood FROM listings ORDER BY neighborhood ASC');
    res.json({
      listings: rows.map(listingOut),
      neighborhoods: neighborhoods.map((r) => r.neighborhood),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load listings.' });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM listings WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Listing not found.' });
    const reviews = await query(
      'SELECT r.*, u.name AS reviewer_name FROM landlord_reviews r JOIN users u ON u.id = r.user_id WHERE r.listing_id = ? ORDER BY r.created_at DESC',
      [req.params.id]
    );
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
    let bookmarked = false;
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-only-secret-change-me');
        const bm = await query('SELECT id FROM bookmarks WHERE user_id = ? AND listing_id = ?', [payload.id, req.params.id]);
        bookmarked = bm.length > 0;
      } catch { /* treat as logged out */ }
    }
    res.json({ listing: listingOut(rows[0]), reviews, avgRating: avg, bookmarked });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not load listing.' });
  }
});

app.post('/api/listings', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    const required = ['title', 'neighborhood', 'address_label', 'price_per_bedroom', 'bedrooms', 'bathrooms', 'distance_min', 'available_from'];
    for (const f of required) {
      if (b[f] === undefined || b[f] === '') {
        return res.status(400).json({ error: `Missing field: ${f}` });
      }
    }
    const rows = await query(
      'INSERT INTO listings (title, neighborhood, address_label, price_per_bedroom, bedrooms, bathrooms, distance_min, furnished, utilities_included, available_from, description, amenities, landlord_label, posted_by, is_demo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?) RETURNING id',
      [
        b.title, b.neighborhood, b.address_label,
        toInt(b.price_per_bedroom, 0), toInt(b.bedrooms, 1), toInt(b.bathrooms, 1),
        toInt(b.distance_min, 0), b.furnished ? 1 : 0, b.utilities_included ? 1 : 0,
        b.available_from, b.description || '', JSON.stringify(b.amenities || []),
        b.landlord_label || '', req.user.id, now(),
      ]
    );
    const created = (await query('SELECT * FROM listings WHERE id = ?', [rows[0].id]))[0];
    res.status(201).json({ listing: listingOut(created) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create listing.' });
  }
});

// ---------- landlord reviews ----------
app.get('/api/listings/:id/reviews', async (req, res) => {
  const reviews = await query(
    'SELECT r.*, u.name AS reviewer_name FROM landlord_reviews r JOIN users u ON u.id = r.user_id WHERE r.listing_id = ? ORDER BY r.created_at DESC',
    [req.params.id]
  );
  res.json({ reviews });
});

app.post('/api/listings/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment = '' } = req.body || {};
    const r = toInt(rating, 0);
    if (r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1–5.' });
    const listing = (await query('SELECT * FROM listings WHERE id = ?', [req.params.id]))[0];
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    const rows = await query(
      'INSERT INTO landlord_reviews (listing_id, user_id, landlord_name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [req.params.id, req.user.id, listing.landlord_label || 'Landlord', r, comment, now()]
    );
    const created = (await query('SELECT * FROM landlord_reviews WHERE id = ?', [rows[0].id]))[0];
    res.status(201).json({ review: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not save review.' });
  }
});

// ---------- bookmarks ----------
app.get('/api/bookmarks', authMiddleware, async (req, res) => {
  const rows = await query(
    'SELECT l.* FROM bookmarks b JOIN listings l ON l.id = b.listing_id WHERE b.user_id = ? ORDER BY b.created_at DESC',
    [req.user.id]
  );
  res.json({ listings: rows.map(listingOut) });
});

app.post('/api/bookmarks/:listingId', authMiddleware, async (req, res) => {
  try {
    const listing = (await query('SELECT id FROM listings WHERE id = ?', [req.params.listingId]))[0];
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    await query(
      'INSERT INTO bookmarks (user_id, listing_id, created_at) VALUES (?, ?, ?) ON CONFLICT (user_id, listing_id) DO NOTHING',
      [req.user.id, req.params.listingId, now()]
    ).catch(async () => {
      // Postgres < 15 and SQLite both support the above; if the engine
      // rejects it, fall back to an existence check + plain insert.
      const ex = await query('SELECT id FROM bookmarks WHERE user_id = ? AND listing_id = ?', [req.user.id, req.params.listingId]);
      if (ex.length === 0) {
        await query('INSERT INTO bookmarks (user_id, listing_id, created_at) VALUES (?, ?, ?)', [req.user.id, req.params.listingId, now()]);
      }
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not save bookmark.' });
  }
});

app.delete('/api/bookmarks/:listingId', authMiddleware, async (req, res) => {
  await query('DELETE FROM bookmarks WHERE user_id = ? AND listing_id = ?', [req.user.id, req.params.listingId]);
  res.json({ ok: true });
});

// ---------- questionnaire ----------
const Q_FIELDS = ['budget_min', 'budget_max', 'neighborhoods', 'move_in', 'bedrooms_needed', 'sleep_schedule', 'cleanliness', 'guests', 'smoking', 'study_habits', 'noise_tolerance'];
const SLEEP_VALUES = ['early', 'night', 'flexible'];
const GUEST_VALUES = ['rare', 'occasional', 'often'];
const SMOKING_VALUES = ['no', 'yes', 'ok'];
const STUDY_VALUES = ['quiet', 'social'];

function validateQuestionnaire(b) {
  if (b.budget_min === undefined || b.budget_max === undefined) return 'Budget range is required.';
  if (toInt(b.budget_min, 0) > toInt(b.budget_max, 0)) return 'Minimum budget cannot exceed maximum budget.';
  if (!Array.isArray(b.neighborhoods) || b.neighborhoods.length === 0) return 'Pick at least one neighborhood.';
  if (!b.move_in) return 'Move-in date is required.';
  if (!SLEEP_VALUES.includes(b.sleep_schedule)) return 'Sleep schedule must be early, night, or flexible.';
  if (toInt(b.cleanliness, 0) < 1 || toInt(b.cleanliness, 0) > 5) return 'Cleanliness must be 1–5.';
  if (!GUEST_VALUES.includes(b.guests)) return 'Guests must be rare, occasional, or often.';
  if (!SMOKING_VALUES.includes(b.smoking)) return 'Smoking must be no, yes, or ok.';
  if (!STUDY_VALUES.includes(b.study_habits)) return 'Study habits must be quiet or social.';
  if (toInt(b.noise_tolerance, 0) < 1 || toInt(b.noise_tolerance, 0) > 5) return 'Noise tolerance must be 1–5.';
  return null;
}

app.get('/api/profile/questionnaire', authMiddleware, async (req, res) => {
  const rows = await query('SELECT * FROM questionnaires WHERE user_id = ?', [req.user.id]);
  res.json({ questionnaire: questionnaireOut(rows[0]) || null });
});

app.put('/api/profile/questionnaire', authMiddleware, async (req, res) => {
  const err = validateQuestionnaire(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const b = req.body;
  const existing = await query('SELECT user_id FROM questionnaires WHERE user_id = ?', [req.user.id]);
  const params = [
    toInt(b.budget_min, 0), toInt(b.budget_max, 0), JSON.stringify(b.neighborhoods),
    b.move_in, toInt(b.bedrooms_needed, 2), b.sleep_schedule, toInt(b.cleanliness, 3),
    b.guests, b.smoking, b.study_habits, toInt(b.noise_tolerance, 3), now(),
  ];
  if (existing.length > 0) {
    await query(
      'UPDATE questionnaires SET budget_min=?, budget_max=?, neighborhoods=?, move_in=?, bedrooms_needed=?, sleep_schedule=?, cleanliness=?, guests=?, smoking=?, study_habits=?, noise_tolerance=?, updated_at=? WHERE user_id=?',
      [...params, req.user.id]
    );
  } else {
    await query(
      'INSERT INTO questionnaires (budget_min, budget_max, neighborhoods, move_in, bedrooms_needed, sleep_schedule, cleanliness, guests, smoking, study_habits, noise_tolerance, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [...params, req.user.id]
    );
  }
  const rows = await query('SELECT * FROM questionnaires WHERE user_id = ?', [req.user.id]);
  res.json({ questionnaire: questionnaireOut(rows[0]) });
});

// ---------- roommate matching ----------
app.get('/api/matches', authMiddleware, async (req, res) => {
  try {
    const mine = (await query('SELECT * FROM questionnaires WHERE user_id = ?', [req.user.id]))[0];
    if (!mine) {
      return res.status(400).json({ error: 'Complete your housing questionnaire first to see matches.' });
    }
    const mineQ = questionnaireOut(mine);
    const others = await query(
      `SELECT u.*, q.budget_min, q.budget_max, q.neighborhoods, q.move_in, q.bedrooms_needed,
              q.sleep_schedule, q.cleanliness, q.guests, q.smoking, q.study_habits, q.noise_tolerance
       FROM users u JOIN questionnaires q ON q.user_id = u.id WHERE u.id != ?`,
      [req.user.id]
    );
    const requests = await query(
      'SELECT * FROM roommate_requests WHERE from_user_id = ? OR to_user_id = ?',
      [req.user.id, req.user.id]
    );
    const statusByUser = {};
    for (const r of requests) {
      const otherId = r.from_user_id === req.user.id ? r.to_user_id : r.from_user_id;
      statusByUser[otherId] = {
        status: r.status,
        direction: r.from_user_id === req.user.id ? 'outgoing' : 'incoming',
        requestId: r.id,
      };
    }
    const matches = others.map((o) => {
      const oq = questionnaireOut(o);
      const { score, factors, strengths, watchOuts } = scorePair(mineQ, oq);
      return {
        user: publicUser(o),
        score,
        factors,
        strengths,
        watchOuts,
        request: statusByUser[o.id] || null,
      };
    });
    matches.sort((a, b) => b.score - a.score);
    res.json({ matches });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not compute matches.' });
  }
});

// ---------- roommate requests ----------
app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { toUserId, message = '' } = req.body || {};
    if (!toUserId) return res.status(400).json({ error: 'toUserId is required.' });
    if (Number(toUserId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot send a roommate request to yourself.' });
    }
    const target = (await query('SELECT id FROM users WHERE id = ?', [toUserId]))[0];
    if (!target) return res.status(404).json({ error: 'That student does not exist.' });
    const existing = (await query(
      'SELECT * FROM roommate_requests WHERE from_user_id = ? AND to_user_id = ?',
      [req.user.id, toUserId]
    ))[0];
    if (existing && existing.status !== 'declined') {
      return res.status(409).json({ error: 'You already have a request with this student.' });
    }
    if (existing && existing.status === 'declined') {
      await query('DELETE FROM roommate_requests WHERE id = ?', [existing.id]);
    }
    const rows = await query(
      "INSERT INTO roommate_requests (from_user_id, to_user_id, message, status, created_at) VALUES (?, ?, ?, 'pending', ?) RETURNING id",
      [req.user.id, toUserId, message, now()]
    );
    const created = (await query('SELECT * FROM roommate_requests WHERE id = ?', [rows[0].id]))[0];
    res.status(201).json({ request: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not send request.' });
  }
});

app.get('/api/requests', authMiddleware, async (req, res) => {
  const incoming = await query(
    `SELECT r.*, u.name AS from_name, u.major AS from_major, u.grad_year AS from_grad_year
     FROM roommate_requests r JOIN users u ON u.id = r.from_user_id
     WHERE r.to_user_id = ? ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  const outgoing = await query(
    `SELECT r.*, u.name AS to_name, u.major AS to_major, u.grad_year AS to_grad_year
     FROM roommate_requests r JOIN users u ON u.id = r.to_user_id
     WHERE r.from_user_id = ? ORDER BY r.created_at DESC`,
    [req.user.id]
  );
  res.json({ incoming, outgoing });
});

app.post('/api/requests/:id/accept', authMiddleware, async (req, res) => {
  const r = (await query('SELECT * FROM roommate_requests WHERE id = ?', [req.params.id]))[0];
  if (!r) return res.status(404).json({ error: 'Request not found.' });
  if (r.to_user_id !== req.user.id) return res.status(403).json({ error: 'Only the recipient can accept.' });
  if (r.status !== 'pending') return res.status(400).json({ error: `Request is already ${r.status}.` });
  await query("UPDATE roommate_requests SET status = 'accepted' WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

app.post('/api/requests/:id/decline', authMiddleware, async (req, res) => {
  const r = (await query('SELECT * FROM roommate_requests WHERE id = ?', [req.params.id]))[0];
  if (!r) return res.status(404).json({ error: 'Request not found.' });
  if (r.to_user_id !== req.user.id) return res.status(403).json({ error: 'Only the recipient can decline.' });
  if (r.status !== 'pending') return res.status(400).json({ error: `Request is already ${r.status}.` });
  await query("UPDATE roommate_requests SET status = 'declined' WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/housemates', authMiddleware, async (req, res) => {
  const rows = await query(
    `SELECT u.* FROM roommate_requests r
     JOIN users u ON u.id = CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END
     WHERE (r.from_user_id = ? OR r.to_user_id = ?) AND r.status = 'accepted'`,
    [req.user.id, req.user.id, req.user.id]
  );
  res.json({ housemates: rows.map(publicUser) });
});

// ---------- 404 + error handling ----------
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

async function start() {
  await initSchema();
  await seed();
  app.listen(PORT, () => {
    console.log(`Off Campus Compass API listening on port ${PORT} (engine: ${usePg ? 'postgres' : 'sqlite'})`);
  });
}

start().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
