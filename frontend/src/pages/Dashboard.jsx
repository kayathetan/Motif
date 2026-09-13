import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import ChipSet from '../components/ChipSet.jsx'
import { useBrief } from '../store.jsx'
import { fetchBrandProfile, fetchBriefs } from '../api.js'

const PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts']

/**
 * Landing spot for every signed-in visit - after Onboarding's "you're all
 * set" confirmation for a new account, and straight after sign-in for a
 * returning one (see Signup.jsx/SignIn.jsx's forceRedirectUrl).
 *
 * Two real entry points, not a nav link to a page with nothing to show
 * yet: niche/platform live only in-memory (store.jsx), reset on every
 * page load, and there's no saved-per-account niche (brand_profiles only
 * holds organization_name/description) - so a top-nav "Market" link here
 * would either point at a stale default or an empty state. The market
 * card below asks for a category right where it's used instead, and
 * skips straight to /market with it - no need to route through the full
 * audience/goal/tone form on Inputs just to look something up.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { update } = useBrief()
  const [orgName, setOrgName] = useState(null)
  const [lookupNiche, setLookupNiche] = useState('')
  // Defaults to the platform most likely to actually have data behind it
  // rather than an arbitrary first option - see pipeline/data/video_urls.json.
  const [lookupPlatform, setLookupPlatform] = useState('YouTube Shorts')
  // idle isn't used as a rendered state - briefsStatus starts 'loading' and
  // only ever moves to 'ready' or 'unavailable' (demo mode/a fetch error,
  // both just mean "don't show this section" - not worth a distinct
  // error UI for a secondary, non-blocking part of the page).
  const [briefsStatus, setBriefsStatus] = useState('loading')
  const [briefs, setBriefs] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchBrandProfile(getToken)
      .then((profile) => {
        if (!cancelled && profile) setOrgName(profile.organization_name)
      })
      // Demo mode or a fetch failure just means no name to greet with -
      // not worth surfacing an error for a personalisation touch.
      .catch(() => {})

    fetchBriefs(getToken)
      .then((data) => {
        if (cancelled) return
        setBriefs(data)
        setBriefsStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setBriefsStatus('unavailable')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const viewMarket = (e) => {
    e.preventDefault()
    if (!lookupNiche.trim()) return
    update({ niche: lookupNiche.trim(), platform: lookupPlatform })
    navigate('/market')
  }

  return (
    <>
      <Mesh />
      <Nav variant="app" />

      <div className="hero" style={{ paddingTop: 52 }}>
        <p className="kick">Dashboard</p>
        <h1 className="sm">{orgName ? `Welcome back, ${orgName}` : 'Welcome back'}</h1>
      </div>

      <div className="wrap">
        <div className="dash-actions">
          <Link className="dash-card" to="/inputs">
            <p className="dl">New brief</p>
            <h3>Build a brief</h3>
            <p>
              Category, platform, audience and goal in, a scene-by-scene production brief out - grounded in
              measured performance, not a template.
            </p>
            <p className="go">Start a new brief →</p>
          </Link>

          <form className="dash-card" onSubmit={viewMarket}>
            <p className="dl">Market lookup</p>
            <h3>Check a category</h3>
            <p>Review structural performance for a category before committing to a brief.</p>

            <div className="field">
              <label htmlFor="lookup-niche">Category</label>
              <input
                id="lookup-niche"
                value={lookupNiche}
                onChange={(e) => setLookupNiche(e.target.value)}
                placeholder="e.g. skincare"
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>Platform</label>
              <ChipSet name="lookup-platform" options={PLATFORMS} value={lookupPlatform} onChange={setLookupPlatform} />
            </div>

            <p className="go" style={{ marginTop: 20 }}>
              <button className="btn-dark" type="submit" disabled={!lookupNiche.trim()}>View market →</button>
            </p>
          </form>
        </div>

        {briefsStatus === 'ready' && briefs.length > 0 && (
          <div className="sec" style={{ marginTop: 48 }}>
            <h2>Previous briefs</h2>
            <div className="brief-list">
              {briefs.map((b) => (
                <Link key={b.id} to={`/briefs/${b.id}`} className="brief-row">
                  <div>
                    <p className="bt">{b.topic || `${b.niche} · ${b.goal}`}</p>
                    <p className="bs">{b.niche} · {b.platform} · {b.audience}</p>
                  </div>
                  <p className="bd">
                    {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {briefsStatus === 'ready' && briefs.length === 0 && (
          <div className="sec" style={{ marginTop: 48 }}>
            <h2>Previous briefs</h2>
            <div className="brief-list">
              <div style={{ padding: '15px 20px' }}>
                <p className="bs">Nothing generated yet - your first brief will show up here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
