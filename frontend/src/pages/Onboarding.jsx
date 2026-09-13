import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { saveBrandProfile } from '../api.js'

/**
 * Shown once, right after Signup (see Signup.jsx's forceRedirectUrl) -
 * not on every sign-in (SignIn.jsx goes straight to /dashboard). Saves to
 * the account server-side (services/brand_profile.py) so it's folded into
 * every future brief automatically instead of being re-asked, then hands
 * off to /dashboard rather than silently redirecting - a deliberate
 * confirmation beat, not an instant jump.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [organizationName, setOrganizationName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | success | error

  const submit = async (e) => {
    e.preventDefault()
    if (!organizationName.trim()) return

    setStatus('saving')
    try {
      await saveBrandProfile(
        { organization_name: organizationName.trim(), description: description.trim() || null },
        getToken
      )
      setStatus('success')
    } catch {
      // Not blocking: a failed save shouldn't strand someone mid-signup.
      // They can still use the product without this context - it just
      // won't be folded into their briefs until it's saved successfully.
      setStatus('error')
    }
  }

  return (
    <>
      <Mesh />
      <Nav variant="app" />

      <div className="sheet wide">
        <div className="formcard">
          {status === 'success' ? (
            <div className="card" style={{ padding: '40px', background: 'var(--good-bg)', textAlign: 'center' }}>
              <p style={{ color: 'var(--good)', fontWeight: 510, fontSize: 17 }}>You&apos;re all set ✓</p>
              <p style={{ color: 'var(--ink-2)', marginTop: 8, fontSize: 14 }}>
                {organizationName.trim()} is saved to your account - every brief from here on will already know who
                you are.
              </p>
              <p style={{ marginTop: 24 }}>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to your dashboard →</button>
              </p>
            </div>
          ) : (
            <>
              <h2>Tell us about your business</h2>
              <p className="lede">
                Saved once to your account and folded into every brief from here on, so you don&apos;t re-explain who
                you are each time. <b>Only the name is required.</b>
              </p>

              <form onSubmit={submit}>
                <div className="field">
                  <label htmlFor="org-name">Organization or brand name</label>
                  <input
                    id="org-name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Glow Recipe"
                    autoComplete="organization"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="org-desc">
                    What does your company or brand do?{' '}
                    <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea
                    id="org-desc"
                    style={{ minHeight: 120 }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What you sell, who it's for, and anything about your positioning a strategist would want to know."
                  />
                </div>

                {status === 'error' && (
                  <p className="hint" style={{ color: 'var(--bad)' }}>
                    Couldn&apos;t save that just now - you can still continue, and add it later.
                  </p>
                )}

                <div className="actions">
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={status === 'saving' || !organizationName.trim()}
                  >
                    {status === 'saving' ? 'Saving…' : 'Continue →'}
                  </button>
                  <p className="alt">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }}>Skip for now</a>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
