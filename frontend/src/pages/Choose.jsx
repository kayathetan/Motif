import { Link } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import Pills from '../components/Pills.jsx'
import { useBrief } from '../store.jsx'

export default function Choose() {
  const { brief } = useBrief()

  return (
    <>
      <Mesh />
      <Nav variant="app" links={[{ label: 'Market', to: '/market' }, { label: 'Inputs', to: '/inputs' }]} />

      <div className="hero" style={{ paddingTop: 52 }}>
        <h1 className="sm">Select a workflow.</h1>
        <Pills brief={brief} editable />
      </div>

      <div className="wrap">
        <div className="sec" style={{ marginTop: 0 }}>
          <Link className="card tc" to="/market" style={{ display: 'block', padding: '24px 26px' }}>
            <p className="tl" style={{ color: 'var(--purple-deep)' }}>Before either of those</p>
            <h4 style={{ marginTop: 8 }}>Read the market first →</h4>
            <p style={{ maxWidth: '78ch' }}>
              Category attention volume, your share of it, what the market is rewarding this quarter, and what a
              thousand views costs you organically against paid. <b>The brief and the audit are both judged against
              these numbers.</b>
            </p>
          </Link>
        </div>

        <div className="doors">
          <Link className="card door create" to="/vision">
            <div className="ic" />
            <p className="dk">Pre-production</p>
            <h3>Build a brief for new content</h3>
            <p>
              You have a concept but no production plan. Motif returns a scene-by-scene brief your team or creator can
              shoot from immediately: hooks, timestamped outline, pacing, lighting, shot, on-screen text and the CTA line.
            </p>
            <p className="go">Build my brief →</p>
          </Link>

          <Link className="card door audit" to="/upload">
            <div className="ic" />
            <p className="dk">Post-production</p>
            <h3>Audit content you have already made</h3>
            <p>
              You have a draft that is underperforming. Motif scores its structure against the top quartile in your
              niche and ranks the gaps by impact, so you know which fix to make first.
            </p>
            <p className="go">Run an audit →</p>
          </Link>
        </div>
      </div>
    </>
  )
}
