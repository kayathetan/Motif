/**
 * Thin client for the FastAPI backend. Vite proxies /api to
 * http://127.0.0.1:8000 in dev (see vite.config.js).
 *
 * Both routes below now require a real Clerk session server-side (see
 * backend/src/services/auth.py) - previously the backend had no auth at
 * all, and this file never attached a token even for real signed-in
 * users. Callers now pass Clerk's getToken (from useAuth()) so the token
 * can be attached as `Authorization: Bearer <token>`.
 */
import { isDemo } from './demo.js'

/**
 * Thrown instead of calling the network in demo mode - by generateBrief
 * only. A demo visitor has no token, and brief generation is gated behind
 * a verified Clerk session server-side because every brief is a distinct,
 * uncacheable GPT-4o call. Short-circuit before the network instead of
 * letting a guaranteed 401 round-trip, so callers can show a calm
 * explanatory state rather than a fetch failure.
 *
 * fetchIntelligence deliberately does NOT throw this: that route serves
 * anonymous callers and caches its one LLM call, so a demo visitor sees
 * real aggregated market data. See backend/src/routers/intelligence.py.
 */
export class DemoModeUnavailable extends Error {
  constructor() {
    super(
      'Demo mode shows the full interface without live generation - sign in for a real, measured result.'
    )
    this.name = 'DemoModeUnavailable'
  }
}

/** {} when signed out (getToken() resolves null) rather than sending a bogus header. */
async function authHeaders(getToken) {
  const token = await getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// The backend takes one platform from a fixed 3-value set; the campaign
// form's labels are close but not identical.
const PLATFORM_TO_BACKEND = {
  'Instagram Reels': 'reels',
  TikTok: 'tiktok',
  'YouTube Shorts': 'youtube_shorts',
}

// The backend takes one goal; the campaign form allows selecting several
// objectives. First selected wins - matching the "where objectives
// conflict, the first takes precedence" rule already stated on the Inputs
// page. "Retention" has no direct match in the backend's fixed set, so it
// maps to the closest one, "engagement".
const OBJECTIVE_TO_GOAL = {
  Shares: 'shares',
  Reach: 'reach',
  Retention: 'engagement',
  Conversions: 'conversions',
}

// The backend takes one brand_vibe from a fixed 4-value set; the campaign
// form's "tone" is a freer multi-select with different labels. Approximate
// mapping, first selected tone wins.
const TONE_TO_VIBE = {
  Measured: 'educational',
  'High tempo': 'fun',
  'Warm, personal': 'raw',
  'Clinical, factual': 'educational',
  Humorous: 'fun',
}

/** Map the campaign-inputs shape (store.jsx) to the backend's BriefRequest. */
export function toBriefRequest(brief) {
  return {
    niche: brief.niche,
    platform: PLATFORM_TO_BACKEND[brief.platform] || 'tiktok',
    goal: OBJECTIVE_TO_GOAL[brief.objectives[0]] || 'engagement',
    audience: brief.audience,
    brand_vibe: TONE_TO_VIBE[brief.tone[0]] || 'fun',
    // These are already collected by Vision.jsx/Inputs.jsx but previously
    // never left the frontend. No new UI - content_type has no dedicated
    // control at all; the backend infers it from creative_vision/topic
    // when relevant (see brief_generator.infer_content_type).
    creative_vision: brief.vision || null,
    topic: brief.topic || null,
    resources: brief.resources?.length ? brief.resources : null,
    duration: brief.duration || null,
    constraints: brief.constraints || null,
  }
}

/**
 * POST /api/brief/generate. Throws with a readable message on failure -
 * or DemoModeUnavailable, without ever calling the network, in demo mode.
 *
 * Args:
 *   brief: The campaign inputs (store.jsx shape).
 *   getToken: Clerk's useAuth().getToken, so the request carries a real
 *     session token - the backend now requires one.
 */
export async function generateBrief(brief, getToken) {
  if (isDemo()) throw new DemoModeUnavailable()

  const res = await fetch('/api/brief/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders(getToken)) },
    body: JSON.stringify(toBriefRequest(brief)),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brief generation failed (${res.status}): ${body || res.statusText}`)
  }
  return res.json()
}

/**
 * GET /api/intelligence/{niche}/{platform}. Returns null (not a throw) on a
 * 404 - no patterns for this niche/platform yet is an expected, normal
 * state (e.g. a brand-new niche, or the library hasn't been built yet),
 * not an error condition for the caller to handle specially.
 *
 * Works signed in or not: the backend route accepts anonymous callers, so
 * this never throws DemoModeUnavailable - a /demo visitor sees the same
 * real aggregate a signed-in user does.
 *
 * Args:
 *   niche, platform: As before.
 *   getToken: Clerk's useAuth().getToken - see generateBrief. Resolves
 *     null when signed out, in which case no Authorization header is sent.
 */
export async function fetchIntelligence(niche, platform, getToken) {
  // No isDemo() short-circuit: this route is open to anonymous callers,
  // so a demo visitor gets the same real data a signed-in user does.
  // authHeaders() sends no Authorization header when getToken() resolves
  // null, which is exactly what the backend's optional_user expects.

  const backendPlatform = PLATFORM_TO_BACKEND[platform] || 'tiktok'
  const res = await fetch(
    `/api/intelligence/${encodeURIComponent(niche)}/${encodeURIComponent(backendPlatform)}`,
    { headers: await authHeaders(getToken) }
  )
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Intelligence fetch failed (${res.status}): ${body || res.statusText}`)
  }
  return res.json()
}
