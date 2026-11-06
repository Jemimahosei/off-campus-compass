# Off Campus Compass

**Find your place off campus, and the people to share it with.**

Off Campus Compass helps Cornell students find off-campus housing near campus and
roommates who actually fit — without having to network with upperclassmen just to
get basic details about good housing options. It started as jem's BigRedHack 2024
project ([Devpost](https://devpost.com/software/off-campus-compass)) and was
rebuilt here as a fully functional web app, combined with the matching work from
her INFO 4125 product-management class project.

## What it does

- **Browse off-campus listings** near Cornell / Collegetown with filters for
  price per bedroom, bedrooms, neighborhood, distance to campus, furnished,
  utilities included, and availability date. Listing detail pages show amenities
  and landlord information.
- **Landlord reviews** — students can rate and review landlords on each listing,
  so the information other platforms lack is visible before anyone signs.
- **Roommate matching** — a 10-question housing questionnaire (budget,
  neighborhoods, move-in date, sleep schedule, cleanliness, guests, smoking,
  study habits, noise tolerance). Matches are scored 0–100 with a transparent
  per-factor breakdown: every match shows *why* two people fit and what to talk
  about first.
- **Roommate requests** — send, accept, and decline requests; accepted requests
  make you housemates.
- **Save / bookmark listings**, **post your own listing**, and a **profile**
  page with your preferences.
- **Demo accounts** (password `demo123` for all):
  - `demo@offcampuscompass.demo` — Maya Chen, junior, Information Science
  - `jordan@offcampuscompass.demo` — Jordan Ellis, senior, Mechanical Engineering
  - `priya@offcampuscompass.demo` — Priya Nair, sophomore, Biology

All seeded listings and profiles are fictional and marked as demos. Street names
are real Ithaca geography (College Ave, Dryden Rd, Stewart Ave…) but there are
no real landlords, phone numbers, or house numbers.

## Stack

- **Frontend:** React 19 + TypeScript + Vite (hash routing, no server config
  needed), styled with a Cornell carnelian-and-cream design and a compass motif.
- **Backend:** Node 24 + Express, JWT auth (bcrypt password hashing).
- **Database:** SQLite by default (Node's built-in `node:sqlite`, file at
  `backend/data/compass.db`). If `DATABASE_URL` is a `postgres://` URL (e.g. a
  Neon database), the same queries run against Postgres instead.
- **Deploy:** `render.yaml` at the repo root (Node web service + static site).

## Run locally

```bash
# Backend (port 8080)
cd backend
npm install
npm start

# Frontend (port 5173) — in a second terminal
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend talks to the backend at
`http://localhost:8081/api` by default in dev (see `VITE_API_URL`).

## Environment variables

| Variable | Required | What it does |
|---|---|---|
| `PORT` | no (default 8080) | Backend port |
| `JWT_SECRET` | yes in production | Signing key for login tokens. A dev-only default is used locally — set a real one when deploying. |
| `DATABASE_URL` | no | Leave unset for local SQLite; set to a `postgres://` URL for persistent hosted data. |
| `SQLITE_PATH` | no | Override the SQLite file location. |
| `VITE_API_URL` | yes at frontend build time | Backend base URL + `/api` (e.g. `https://off-campus-compass-backend.onrender.com/api`). |
| `FRONTEND_URL` | no | CORS origin for the backend (defaults to allowing the frontend). |

## The matching algorithm

Scores are 0–100, weights sum to 100: budget overlap 20, neighborhoods 15,
move-in date 10, sleep schedule 15, cleanliness 15, guests 10, smoking 5,
study habits 5, noise tolerance 5. See `backend/src/matching.js`.

**Provenance note:** jem's INFO 4125 teammates (including Anamitra Rawat)
built a matching algorithm for this project, but the original file was not
retrievable while building this — the shared Drive folder is not visible from
the connected Drive account, there is no Figma connector, and the Housing Hub
repo is private. The algorithm here was written from the Devpost description
plus standard roommate-matching criteria. When jem shares the teammates'
original, the weights should be compared and reconciled.

## Project structure

```
off-campus-compass/
├── render.yaml            # Render Blueprint (backend + frontend)
├── README.md
├── DEPLOY_NOTES.md        # deploy checklist for the person shipping this
├── backend/
│   ├── src/
│   │   ├── server.js      # Express app + all API routes
│   │   ├── db.js          # SQLite/Postgres dual-engine data layer
│   │   ├── schema.js      # table definitions
│   │   ├── seed.js        # demo users, listings, reviews
│   │   ├── matching.js    # compatibility scoring (transparent)
│   │   └── auth.js        # JWT sign/verify, password helpers
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx        # hash routing + header
    │   ├── components.tsx # listing cards, compass mark, stars
    │   ├── lib/api.ts     # typed API client
    │   └── pages/         # Home, Browse, ListingDetail, Matching,
    │                      #   Requests, Saved, PostListing, Auth, Profile
    └── package.json
```
