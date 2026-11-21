# Off Campus Compass

## 🔗 Live site: https://off-campus-compass-frontend.onrender.com

Off-campus housing finder for Cornell students. Browse listings near campus with filters for price, bedrooms, neighborhood, and distance, read landlord reviews, and find roommates with a 10-question questionnaire that scores matches 0–100 with a per-factor breakdown. Started as a BigRedHack 2024 project.

Demo login: `demo@offcampuscompass.demo` / `demo123` (seeded demo data only).

## Architecture

```
Browser ──▶ React + TypeScript + Vite (hash routing)
              │  REST calls to /api
              ▼
           Express API (Node, JWT auth)
              │  reads / writes
              ▼
           SQLite (local) or Postgres via DATABASE_URL
```

- **Frontend** (React 19, TypeScript, Vite): listing browse/detail, landlord reviews, roommate matching, requests, saved listings, posting a listing, profile.
- **Backend** (Express): auth (JWT, bcrypt), listings, reviews, bookmarks, questionnaire, matching, and roommate requests (`/api/listings`, `/api/matches`, `/api/requests`, …).
- **Matching** (`backend/src/matching.js`): 10-question questionnaire scored 0–100 — budget 20, neighborhoods 15, sleep schedule 15, cleanliness 15, move-in date 10, guests 10, smoking 5, study habits 5, noise tolerance 5.
- **Deploy**: `render.yaml` — Node web service (backend) + static site (frontend) on Render.

## Stack

React 19 · TypeScript · Vite · Express · Node · SQLite / Postgres · Render

## Run it locally

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

Open http://localhost:5173. The frontend reads the API URL from `VITE_API_URL` (defaults to `http://localhost:8081/api` in dev).

## Notes

- Seeded listings and profiles are fictional demo data; street names are real Ithaca geography, but there are no real landlords, phone numbers, or house numbers.
- The live site is on Render's free tier, so the first load can take about a minute while it wakes up.
