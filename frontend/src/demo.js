/**
 * Demo mode: lets someone with the /demo link use the whole product without
 * creating an account. Intended for judges and reviewers.
 *
 * It only ever bypasses the client-side route gate (Protected.jsx). It grants
 * no token and no backend access - the FastAPI routes that cost money now
 * verify Clerk JWTs (see backend/src/services/auth.py), and a demo visitor is
 * unauthenticated to them, same as anyone else with no session. That's
 * deliberate: api.js checks isDemo() and skips calling those routes entirely
 * rather than making a request that would just 401 - see api.js's
 * DemoModeUnavailable and Brief.jsx/Market.jsx's 'demo' state for what a demo
 * visitor sees instead.
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
