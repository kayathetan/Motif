/**
 * Demo mode: lets someone with the /demo link use the whole product without
 * creating an account. Intended for judges and reviewers.
 *
 * It only ever bypasses the client-side route gate. It grants no token and no
 * backend access, so when the FastAPI routes start verifying Clerk JWTs a demo
 * visitor will still be unauthenticated to the API. That is deliberate.
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
