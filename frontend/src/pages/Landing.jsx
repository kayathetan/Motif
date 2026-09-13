import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClerkLoaded, ClerkLoading, Show } from '@clerk/react'
import ShaderBackground from '../components/ShaderBackground.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

const product = [
  {
    kicker: 'Market research',
    title: 'What your category actually rewards',
    body: <>The dominant format, how fast the hook lands, which content and CTA types the top performers use, and the structural benchmark they hit. <b>A measured report, not a trend list</b></>
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
          { label: 'Product', href: '#product' },
          { label: 'For teams', href: '#teams' },
          { label: 'How it works', href: '#how' }
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
          <p className="under">Structural patterns measured from public short-form video</p>
        </form>

        <div className="pills" style={{ marginTop: 34 }}>
          <span className="pill">Category benchmarks</span>
          <span className="pill">Hook timing</span>
          <span className="pill">Format breakdown</span>
          <span className="pill">Briefs your team can execute</span>
        </div>
      </div>

      <div className="wrap">
        {/* hard numbers first: the feedback was that it read as a marketing
            helper rather than something with a business case */}
        <div className="sec" style={{ marginTop: 56 }}>
          <div className="statrow">
            <div className="card stat">
              <p className="sl">Views analysed</p>
              <p className="sv">46.1<span className="su">M views</span></p>
              <p className="sn">Across every video in the <b>structural pattern library</b>.</p>
            </div>
            <div className="card stat">
              <p className="sl">Patterns measured</p>
              <p className="sv">44<span className="su">videos</span></p>
              <p className="sn">Each one read for <b>hook, pacing, format and CTA</b> structure.</p>
            </div>
            <div className="card stat">
              <p className="sl">Median hook delivery</p>
              <p className="sv">1.05<span className="su">seconds</span></p>
              <p className="sn">How fast top performers <b>reach their first real word</b>.</p>
            </div>
            <div className="card stat">
              <p className="sl">Time to a shootable brief</p>
              <p className="sv">20<span className="su">seconds</span></p>
              <p className="sn">A full scene-by-scene brief, against <b>days of strategist time</b>.</p>
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
            {/* Asking a signed-in user to "create an account" reads as a
                bug, so the two states get their own copy and destination.
                Wrapped in ClerkLoaded so the first paint doesn't flash the
                signed-out version at someone who is already signed in -
                Show renders nothing until Clerk resolves, and without the
                wrapper neither branch would appear during that gap. */}
            {/* Holds the card's height while Clerk resolves. Without it the
                ClerkLoaded block is genuinely empty for that beat and the
                card renders as a heading over blank space - brief, but this
                is the landing page's closing CTA. Deliberately neutral
                rather than optimistically rendering the signed-out copy,
                which would flash "Create an account" at someone who is
                already signed in. */}
            <ClerkLoading>
              <p style={{ maxWidth: '54ch', margin: '14px auto 0', fontSize: 15.5, minHeight: 98 }}>
                Run one brief against your own category.
              </p>
            </ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-out">
                <p style={{ maxWidth: '54ch', margin: '14px auto 0', fontSize: 15.5 }}>
                  Create a demo workspace and run one brief against your own category. No card required, nothing stored.
                </p>
                <p style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Link className="btn-primary" to="/signup">Create an account →</Link>
                  <Link className="btn-ghost" to="/demo" style={{ alignSelf: 'center' }}>
                    or explore the demo, no sign-up
                  </Link>
                </p>
              </Show>
              <Show when="signed-in">
                <p style={{ maxWidth: '54ch', margin: '14px auto 0', fontSize: 15.5 }}>
                  You&apos;re signed in. Pick a workflow and run a brief against your category.
                </p>
                <p style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Link className="btn-primary" to="/choose">Go to your workspace →</Link>
                  <Link className="btn-ghost" to="/market" style={{ alignSelf: 'center' }}>
                    or read the market first
                  </Link>
                </p>
              </Show>
            </ClerkLoaded>
          </div>
        </div>
      </div>

      <div className="foot">
        <p>
          <b>Motif</b> measures structure, not sentiment: hook timing, reveal order, cut rhythm and payoff placement,
          derived from transcript timing across public content in your category.{' '}
          <b>Visual and frame-level analysis is the next phase.</b>
        </p>
        <ClerkLoaded>
          <Show when="signed-out"><Link className="btn-dark" to="/signup">Book a demo →</Link></Show>
          <Show when="signed-in"><Link className="btn-dark" to="/choose">Open Motif →</Link></Show>
        </ClerkLoaded>
      </div>
    </>
  )
}
