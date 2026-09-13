# Motif

AI-powered content intelligence tool that analyses structural patterns from
top-performing short-form video content and generates production-ready
content briefs for marketing teams.

## Structure

- `frontend/` — React + Vite client
- `backend/` — FastAPI server exposing brief generation and niche intelligence
- `pipeline/` — standalone scripts that build the Supabase (Postgres + pgvector) pattern library

## Running the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

`npm run build` outputs to `frontend/dist/`. Vite proxies `/api` to the FastAPI
backend on `127.0.0.1:8000`, so run the backend alongside it for live data.

### Frontend structure

```
frontend/src/
  motif.css         design system: palette, type, components
  store.jsx         campaign inputs shared across the flow
  components/       Nav, Mesh, Pills, ChipSet
  pages/            Landing, Signup, Inputs, Choose, Vision, Brief, Market
```

The flow is: Landing → Signup → Inputs → Choose → Vision → Brief. `Market`
(GET `/api/intelligence/{niche}/{platform}`) is reachable from the nav once
signed in, for the category benchmarks behind a brief.

Brief and Market call the real backend (`src/api.js`) with a Clerk session
token attached - not fixed example content. `store.jsx` holds what the user
entered and is the payload shape POSTed to `/api/brief/generate`.

Auditing existing content ("Upload" → "Analyse") was scoped out and removed
- it was UI-only mockup with no backend behind it, not a working feature.
