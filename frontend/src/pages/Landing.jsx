import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ShaderBackground from '../components/ShaderBackground.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

const product = [
  {
    kicker: 'Market research',
    title: 'What your category\u2019s attention costs',
    body: <>Volume, growth, saturation, share of voice and the clearing price of a thousand views organic against paid. <b>A market report, not a trend list</b></>
  },
  {
    kicker: 'Production',
    title: 'A brief your team can execute',
    body: <>Hook options, a timestamped outline, pacing, lighting, shot and the approved CTA line, all derived from what the category measurably rewards. <b>A production document, not advice</b></>
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
  ['01', 'Define the campaign', 'Category, platform, target audience and the objective you are optimising for: reach, retention, shares or conversions'],
  ['02', 'Receive the structure', 'A scene-by-scene production brief: hooks, timestamped outline, pacing, lighting, shot, on-screen text and the CTA line'],
  ['03', 'Shoot it', 'Hand the brief to your team or creator and produce against it directly']
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
      <div className="shaderhero" aria-hidden="true">
        <ShaderBackground />
        <div className="shaderhero-fade" />
      </div>
      <Nav
        links={[
          { label: 'Market', to: '/market' },
          { label: 'Product', href: '#product' },
          { label: 'For teams', href: '#teams' },
          { label: 'How it works', href: '#how' },
          { label: 'Pricing' }
        ]}
      />

      <div className="hero">
        <p className="kick">Market intelligence for short-form attention</p>
        <h1>Attention is a market.<br />Enter it with research</h1>
        <p className="sub">
          Short-form video is where your category&apos;s attention gets priced. Motif measures what that market
          rewards structurally, benchmarks your output against it and issues production briefs your team can execute.{' '}
          <b>Research first, creative second</b>
        </p>

        <form className="heroform" onSubmit={submit}>
          <div className="row">
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Which category does your business compete in?"
              aria-label="Your category"
            />
            <button className="btn-primary" type="submit">Run a brief</button>
          </div>
          <p className="under">Live market data across 38 categories · refreshed daily</p>
        </form>

        <div className="pills" style={{ marginTop: 34 }}>
          <span className="pill">Category benchmarks</span>
          <span className="pill">Cost of attention</span>
          <span className="pill">Share of voice</span>
          <span className="pill">Briefs your team can execute</span>
        </div>
      </div>

      <div className="wrap">
        {/* hard numbers first: the feedback was that it read as a marketing
            helper rather than something with a business case */}
        <div className="sec" style={{ marginTop: 56 }}>
          <div className="statrow">
            <div className="card stat">
              <p className="sl">Attention measured · 30d</p>
              <p className="sv">4.9<span className="su">B views</span></p>
              <p className="sn">Across <b>38 categories</b> on Reels, TikTok and Shorts.</p>
            </div>
            <div className="card stat">
              <p className="sl">Organic vs paid, per 1,000 views</p>
              <p className="sv">6.1<span className="su">x spread</span></p>
              <p className="sn"><b>$2.40 organic against $14.60 paid.</b> Structure decides which one you pay.</p>
            </div>
            <div className="card stat">
              <p className="sl">Median hit rate before Motif</p>
              <p className="sv">1<span className="su">in 9 posts</span></p>
              <p className="sn">Most published content never clears its category&apos;s median. <b>That is the waste.</b></p>
            </div>
            <div className="card stat">
              <p className="sl">Time to a shootable brief</p>
              <p className="sv">20<span className="su">seconds</span></p>
              <p className="sn">Against <b>days of strategist time</b> per campaign.</p>
            </div>
          </div>
        </div>

        <div className="sec" id="product">
          <h2>What a content programme cannot currently buy</h2>
          <div className="two">
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
              See what your category is actually doing
            </h4>
            <p style={{ maxWidth: '54ch', margin: '14px auto 0', fontSize: 15.5 }}>
              Create a demo workspace and run one brief against your own category. No card required, nothing stored.
            </p>
            <p style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link className="btn-primary" to="/signup">Create an account →</Link>
              <Link className="btn-ghost" to="/demo" style={{ alignSelf: 'center' }}>
                or explore the demo, no sign-up
              </Link>
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
