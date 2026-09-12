import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

const product = [
  {
    kicker: 'Pre-production',
    title: 'A brief a creator can shoot from',
    body: <>Hook options, a timestamped script outline, emotional arc, pacing, lighting, shot, on-screen text and the approved CTA line. <b>A production document, not advice.</b></>
  },
  {
    kicker: 'Post-production',
    title: 'A scored audit of the draft',
    body: <>Where pacing diverges from what performs, ranked by impact. <b>Your hook lands at 6.4s; the top quartile lands under 2.</b> With the correction attached.</>
  },
  {
    kicker: 'Underneath both',
    title: 'A category pattern library',
    body: <>Top-performing content per category, decoded into structure rather than restated as generic advice. <b>Derived from transcript timing, refreshed daily.</b></>
  }
]

const teams = [
  {
    kicker: 'Brand marketing',
    title: 'Consistency across creators',
    body: <>Ten creators briefed on instinct produce ten different structures. Briefed from Motif, they produce ten variations of <b>one structure that is known to work in your category.</b></>
  },
  {
    kicker: 'Social media managers',
    title: 'Volume without a strategist',
    body: <>Structural decisions that previously required a strategist per campaign now take a form and twenty seconds. <b>The judgement is encoded, not outsourced.</b></>
  },
  {
    kicker: 'Agencies',
    title: 'Defensible recommendations',
    body: <>Every line in a Motif brief traces to measured behaviour in the client&apos;s own category. <b>Replaces &quot;trust us&quot; with a benchmark</b> in the room where the work gets approved.</>
  }
]

const steps = [
  ['01', 'Define the campaign', 'Category, platform, target audience, and the objective you are optimising for: reach, retention, shares or conversions.'],
  ['02', 'Select a workflow', 'Build a brief for new content, or audit content your team has already produced.'],
  ['03', 'Receive the structure', 'A scene-by-scene production brief, or a scored audit with gaps ranked in priority order.'],
  ['04', 'Close the loop', 'Shoot against the brief, then return the draft through the audit to measure where execution diverged.']
]

export default function Landing() {
  const navigate = useNavigate()
  const { update } = useBrief()
  const [niche, setNiche] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (niche.trim()) update({ niche: niche.trim() })
    navigate('/signup')
  }

  return (
    <>
      <Mesh tall />
      <Nav
        links={[
          { label: 'Product', href: '#product' },
          { label: 'For teams', href: '#teams' },
          { label: 'How it works', href: '#how' },
          { label: 'Pricing' }
        ]}
      />

      <div className="hero">
        <p className="kick">Structural intelligence for short-form video</p>
        <h1>Structure is the variable<br />you can control.</h1>
        <p className="sub">
          Creative is a judgement call. Structure is measurable. Motif decodes the <b>structural patterns</b> behind
          top-performing content in your category, hook timing, reveal order, pacing and payoff placement, then issues a
          production brief before the shoot and a scored audit after it.
        </p>

        <form className="heroform" onSubmit={submit}>
          <div className="row">
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Which category does your brand publish in?"
              aria-label="Your category"
            />
            <button className="btn-primary" type="submit">Run a brief</button>
          </div>
          <p className="under">Pattern library · 142 skincare · 96 fitness · 210 finance · refreshed daily</p>
        </form>

        <div className="pills" style={{ marginTop: 34 }}>
          <span className="pill">No creative guesswork</span>
          <span className="pill">Benchmarked per category</span>
          <span className="pill">Briefs your creators can shoot from</span>
        </div>
      </div>

      <div className="wrap">
        <div className="sec" id="product">
          <h2>Your team supplies the idea. Motif supplies the structure.</h2>
          <div className="three">
            {product.map((c) => (
              <div className="card fc" key={c.title}>
                <p className="fk">{c.kicker}</p>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec" id="teams">
          <h2>Built for the teams briefing the work</h2>
          <div className="three">
            {teams.map((c) => (
              <div className="card fc" key={c.title}>
                <p className="fk">{c.kicker}</p>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec" id="how">
          <h2>How it works</h2>
          <div className="card">
            <div className="steps">
              {steps.map(([n, title, body]) => (
                <div className="step" key={n}>
                  <p className="sn">{n}</p>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sec">
          <div className="card tc" style={{ textAlign: 'center', padding: '56px 40px' }}>
            <p className="tl" style={{ color: 'var(--purple-deep)' }}>Get started</p>
            <h4 style={{ fontSize: 36, letterSpacing: '-.04em', marginTop: 14 }}>
              See what your category is actually doing.
            </h4>
            <p style={{ maxWidth: '54ch', margin: '14px auto 0', fontSize: 15.5 }}>
              Create a demo workspace and run one brief against your own category. No card required, nothing stored.
            </p>
            <p style={{ marginTop: 28 }}>
              <Link className="btn-primary" to="/signup">Create a demo workspace →</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="foot">
        <p>
          <b>Motif</b> measures structure, not sentiment: hook timing, reveal order, cut rhythm and payoff placement,
          derived from transcript timing across public content in your category.{' '}
          <b>Visual and frame-level analysis is the next phase.</b>
        </p>
        <Link className="btn-dark" to="/signup">Book a demo →</Link>
      </div>
    </>
  )
}
