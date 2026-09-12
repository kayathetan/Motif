/**
 * Thin client for the FastAPI backend. Vite proxies /api to
 * http://127.0.0.1:8000 in dev (see vite.config.js).
 */

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
  }
}

/** POST /api/brief/generate. Throws with a readable message on failure. */
export async function generateBrief(brief) {
  const res = await fetch('/api/brief/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toBriefRequest(brief)),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brief generation failed (${res.status}): ${body || res.statusText}`)
  }
  return res.json()
}
