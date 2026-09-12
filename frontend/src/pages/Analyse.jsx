import { Link } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

const SCORE = 6.2
const ARC_LENGTH = 314          // semicircle of r=100
const dash = `${(SCORE / 10) * ARC_LENGTH} ${ARC_LENGTH}`

const SIGNALS = [
  { label: 'Hook lands at', value: '6.4s', tone: 'var(--bad)', note: <>Benchmark <b>under 2.0s</b> · 4.4s late to any payoff signal</> },
  { label: 'CTA position', value: '91%', tone: 'var(--warn)', note: <>Benchmark <b>78–85%</b> · retention in this niche falls sharply after 80%</> },
  { label: 'Average shot length', value: '6.4s', tone: 'var(--warn)', note: <>Benchmark <b>2–3s</b> · 7 cuts against a top-quartile median of 18</> },
  { label: 'Curiosity gap held', value: '4.0s', tone: 'var(--good)', note: <>Benchmark <b>8.0s</b> · the mechanism is explained roughly twice as early</> }
]

const WORKING = [
  ['Midpoint interrupt', 'At 0:11 it falls inside the 0:08–0:12 window that separates the top quartile from the rest of the field.'],
  ['Mechanism held to the final third', 'Most drafts disclose this in the first ten seconds. Held this late it reads as a reward, which is correct.'],
  ['CTA phrased as a question', 'The higher-sharing format in this niche. Only its position requires adjustment, not its wording.']
]

const GAPS = [
  {
    cls: 'p1',
    tag: '🔴 Priority 1',
    title: 'Hook lands at 6.4 seconds',
    yours: <>Six seconds of setup before <b>any</b> payoff signal: introduction, then topic, then result.</>,
    bench: <>Top performers land a visible payoff <b>under 2 seconds</b>, before any framing at all.</>,
    fix: 'Open directly on the result and move the introduction after it. The footage already contains the shot at 0:06, so this is a re-order, not a reshoot.'
  },
  {
    cls: 'p2',
    tag: '🟡 Priority 2',
    title: 'Static camera, single angle',
    yours: <>7 cuts across 45 seconds, an average shot length of <b>6.4s</b>, with no on-screen captions at any point.</>,
    bench: <>Fast cuts every <b>2–3 seconds</b> with 3–5 text overlays carrying the key lines.</>,
    fix: 'Break the 10–30s explanation into five shorter inserts and add captions. No single shot longer than 4 seconds.'
  },
  {
    cls: 'p3',
    tag: '🟢 Priority 3 · minor',
    title: 'CTA placement at 91% through',
    yours: <>The CTA arrives at <b>0:41</b> of a 45-second video, after the retention cliff.</>,
    bench: <>78–85% performs better here, as retention in this niche falls sharply past 80%.</>,
    fix: 'Move it approximately three seconds earlier. Retain the wording; the question format is already correct.'
  }
]

export default function Analyse() {
  const { brief } = useBrief()

  return (
    <>
      <Mesh />
      <Nav
        variant="app"
        action={{ to: '/brief', label: 'Build a brief' }}
        links={[
          { label: 'Brief', to: '/brief' },
          { label: 'Analyse', to: '/upload', on: true },
          { label: 'Inputs', to: '/inputs' },
          { label: 'Direction', to: '/choose' }
        ]}
      />

      <div className="hero" style={{ paddingTop: 80 }}>
        <p className="kick">Structural audit · reel-oct-draft2</p>
        <h1>The concept works.<br />The order does not.</h1>

        <div className="gauge">
          <div className="gwrap">
            <svg width="260" height="150" viewBox="0 0 260 150" aria-hidden="true">
              <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="#F1E6EA" strokeWidth="20" strokeLinecap="round" />
              <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="#C81E63" strokeWidth="20" strokeLinecap="round" strokeDasharray={dash} />
            </svg>
            <div className="gnum"><b>{SCORE.toFixed(1)}</b><i>out of 10</i></div>
          </div>
        </div>

        <p className="sub" style={{ marginTop: 24 }}>
          Three of five structural beats land where they should. <b>Two are costing you the majority of your audience.</b>{' '}
          Both are correctable in the existing edit.
        </p>
      </div>

      <div className="wrap">
        <div className="sec">
          <h2>Measured signals</h2>
          <div className="signals">
            {SIGNALS.map((s) => (
              <div className="card sig" key={s.label}>
                <p className="sl">{s.label}</p>
                <p className="sn" style={{ color: s.tone }}>{s.value}</p>
                <p className="sb">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec">
          <div className="card working">
            <h3>Performing as intended. Leave unchanged.</h3>
            <ul>
              {WORKING.map(([title, body]) => (
                <li key={title}><b>{title}</b>{body}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sec">
          <h2>Structural gaps, in priority order</h2>
          {GAPS.map((g) => (
            <div className={`card gap ${g.cls}`} key={g.title}>
              <div className="gp">
                <span className="tagp">{g.tag}</span>
                <h3>{g.title}</h3>
              </div>
              <div className="gcol"><p className="gl">Yours</p><p className="gv">{g.yours}</p></div>
              <div className="gcol"><p className="gl">Benchmark</p><p className="gv">{g.bench}</p></div>
              <div className="gcol fix"><p className="gl">The fix</p><p className="gv">{g.fix}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="foot">
        <p>
          Scored on <b>structure only</b>: hook timing, reveal order, cut rhythm and CTA placement, derived from
          transcript timing against 142 public {brief.niche} Reels.{' '}
          <b>Visual and frame-level analysis is the next phase</b> and is not included in this score.
        </p>
        <Link className="btn-dark" to="/upload">Re-run audit after the edit →</Link>
      </div>
    </>
  )
}
