/**
 * Demo mode: lets someone with the /demo link use the whole product without
 * creating an account. Intended for judges and reviewers.
 *
 * It only ever bypasses the client-side route gate (Protected.jsx), and grants
 * no token. What a tokenless visitor can reach is decided per route on the
 * backend, not here:
 *
 *   GET  /api/intelligence/...  serves anonymous callers, so demo mode shows
 *                               real aggregated market data. Its one GPT-4o
 *                               call is cached per niche, which is what makes
 *                               that affordable.
 *   POST /api/brief/generate    requires a verified Clerk session. Every brief
 *                               is a distinct, uncacheable GPT-4o call, so
 *                               api.js short-circuits it in demo mode and
 *                               throws DemoModeUnavailable - see Brief.jsx's
 *                               'demo' state for what the visitor sees.
 */
const KEY = 'motif:demo'

export const isDemo = () => {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export const enableDemo = () => {
  try { localStorage.setItem(KEY, '1') } catch { /* private mode: demo just won't persist */ }
}

export const exitDemo = () => {
  try { localStorage.removeItem(KEY) } catch { /* nothing to clear */ }
}
