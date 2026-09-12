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
  pages/            Landing, Signup, Inputs, Choose, Vision, Upload, Brief, Analyse
```

The flow is: Landing → Signup → Inputs → Choose, then either
Vision → Brief (new content) or Upload → Analyse (existing content).

Brief and Analyse currently render fixed example content for a skincare Reels
campaign. `store.jsx` holds what the user entered and is the payload shape to
POST to the backend once `/api/brief` is live.
