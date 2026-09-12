import { Link } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import Pills from '../components/Pills.jsx'
import { useBrief } from '../store.jsx'

/* ---------- the five scenes of the script outline ---------- */
const SCENES = [
  {
    time: '0 – 2s',
    dur: '2 seconds',
    title: 'Result first',
    body: <>Finished skin, filling the frame. <b>No greeting, no setup.</b> The payoff lands before it has been earned, which is the entire function of this beat.</>,
    frame: { background: 'linear-gradient(118deg,#F6E4C4 0%,#E3C79C 46%,#A78E6B 100%)' },
    subj: { left: '14%', top: '16%', width: '56%', height: '62%' },
    overlay: { text: '3 weeks', style: { left: '9%', bottom: '10%' } },
    spec: [
      ['Format', 'Talking head, no voiceover yet'],
      ['Shot', 'Close-up, handheld, slight push in'],
      ['Light', 'Soft window key, front-left 45°'],
      ['Text', '"3 weeks" · lowercase, bottom third'],
      ['Audio', 'Trending audio cold, full volume']
    ]
  },
  {
    time: '2 – 10s',
    dur: '8 seconds',
    title: 'Setup and tension',
    body: <>State what changed. <b>Do not state why it worked.</b> The unexplained variable is what holds this audience. Close the gap early and they drop at ten seconds.</>,
    frame: { background: 'linear-gradient(118deg,#F4E2C2 0%,#DFC49B 50%,#A08A69 100%)' },
    subj: { left: '24%', top: '30%', width: '44%', height: '56%' },
    spec: [
      ['Format', 'Talking head to camera'],
      ['Shot', 'Medium, static on tripod'],
      ['Light', 'Unchanged, for continuity'],
      ['Text', 'None. Voice carries the beat'],
      ['Audio', 'Voice in, music ducks under']
    ]
  },
  {
    time: '10 – 30s',
    dur: '20 seconds · longest',
    title: 'Explanation',
    body: <>Now the mechanism. One ingredient, how you used it, how often. <b>Held this late it reads as a reward</b>; given away at second three it reads as an ad.</>,
    frame: { background: 'linear-gradient(118deg,#F6E6C8 0%,#E1C79E 48%,#A38C6A 100%)' },
    subj: { left: '20%', top: '34%', width: '52%', height: '44%' },
    overlay: { text: 'niacinamide', style: { left: '9%', top: '11%' } },
    spec: [
      ['Format', 'B-roll over voiceover'],
      ['Shot', 'Detail inserts: hands, product, texture'],
      ['Light', 'Back to the soft window key'],
      ['Text', 'Ingredient name · top third, 2s hold'],
      ['Audio', 'Voice forward, music low']
    ]
  },
  {
    time: '30 – 40s',
    dur: '10 seconds',
    title: 'Proof',
    body: <>The evidence: side-by-side, dated, unedited. <b>New room and harder light by design.</b> The visual change reads as a different day, which is what makes the timeline credible.</>,
    frame: { background: 'linear-gradient(178deg,#EFEFF2 0%,#C9CAD2 40%,#6E7080 100%)' },
    subj: { left: '34%', top: '44%', width: '30%', height: '40%', background: 'rgba(40,42,52,.34)' },
    spec: [
      ['Format', 'Mixed: stills plus live'],
      ['Shot', 'Wide, new location, handheld'],
      ['Light', 'Harder, overhead, cooler. Deliberate'],
      ['Text', 'Dates only · small, corner'],
      ['Audio', 'Music swells on the transition']
    ]
  },
  {
    time: '40 – 45s',
    dur: '5 seconds',
    title: 'Close on the question',
    body: <>Straight to camera. <b>A question out-shares a command in this niche.</b> Shares originate in replies, not in instructions to save the post.</>,
    frame: { background: 'linear-gradient(118deg,#F7E8CC 0%,#E4CBA3 50%,#A6906E 100%)' },
    subj: { left: '27%', top: '24%', width: '44%', height: '62%' },
    overlay: { text: <>would you<br />try this?</>, style: { left: '9%', right: '9%', top: '45%', textAlign: 'center' } },
    spec: [
      ['Format', 'Talking head to camera'],
      ['Shot', 'Medium, static, eye contact'],
      ['Light', 'Soft window, unchanged'],
      ['Text', 'CTA line · centre, held 2s'],
      ['Audio', 'Music up, voice out on the last beat']
    ]
  }
]

const HOOKS = [
  {
    n: 'Option 01 · confession',
    line: '"My skin did this in three weeks and I still don\'t fully know why."',
    why: <>Admitting uncertainty <b>opens a loop the viewer needs closed.</b> Highest share rate of the three options.</>
  },
  {
    n: 'Option 02 · cheap thing',
    line: '"The cheapest thing in my routine was the only one doing anything."',
    why: <>Price reversal is the <b>most-saved hook structure</b> in skincare. Only viable if the product is genuinely inexpensive.</>
  },
  {
    n: 'Option 03 · stakes',
    line: '"Three weeks ago I wouldn\'t have filmed this without makeup."',
    why: <>Implies the before without showing it. <b>Strongest with an established audience</b> that remembers the earlier baseline.</>
  }
]

const REFS = [
  { grad: 'linear-gradient(140deg,#F79BBA,#C81E63)', title: '"I stopped using everything except one thing"', meta: '0:44 · 412K views · 9.1K shares', match: '94% structure match' },
  { grad: 'linear-gradient(140deg,#F7DDAF,#E0431A)', title: '"three weeks, one ingredient, no filter"', meta: '0:41 · 288K views · 6.4K shares', match: '91% structure match' },
  { grad: 'linear-gradient(140deg,#E8447F,#7E1416)', title: '"the cheap one was the good one"', meta: '0:47 · 176K views · 5.2K shares', match: '88% structure match' }
]

const Thirds = () => (
  <div className="thirds"><i className="v1" /><i className="v2" /><i className="h1" /><i className="h2" /></div>
)

function Frame({ scene }) {
  return (
    <div className="frame" style={scene.frame}>
      <div className="subj" style={scene.subj} />
      <Thirds />
      {scene.overlay && <p className="ov" style={scene.overlay.style}>{scene.overlay.text}</p>}
    </div>
  )
}

export default function Brief() {
  const { brief } = useBrief()

  return (
    <>
      <Mesh />
      <Nav
        variant="app"
        action={{ to: '/upload', label: 'Audit a draft' }}
        links={[
          { label: 'Brief', to: '/brief', on: true },
          { label: 'Analyse', to: '/upload' },
          { label: 'Inputs', to: '/inputs' },
          { label: 'Direction', to: '/choose' }
        ]}
      />

      <div className="wrap" style={{ paddingTop: 34 }}>
        <Pills brief={brief} left extra={<>{brief.duration} · <b>five scenes</b></>} />

        {/* script outline leads the page */}
        <div className="sec" style={{ marginTop: 40 }}>
          <h2>Script outline</h2>
          {SCENES.map((s) => (
            <div className="card band" key={s.time}>
              <div>
                <p className="tm">{s.time}</p>
                <p className="dur">{s.dur}</p>
              </div>
              <Frame scene={s} />
              <div className="mid">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
              <div className="spec">
                {s.spec.map(([k, v]) => (
                  <div className="sr" key={k}>
                    <span className="sk">{k}</span>
                    <span className="sv">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sec">
          <h2>Hook options</h2>
          <div className="hooks">
            {HOOKS.map((h) => (
              <div className="card hook" key={h.n}>
                <p className="hn">{h.n}</p>
                <p className="hl">{h.line}</p>
                <p className="hw">{h.why}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec">
          <h2>Direction</h2>
          <div className="trio">
            <div className="card tc">
              <p className="tl">Emotional arc</p>
              <h4>Curiosity → surprise → belonging</h4>
              <div className="arcwrap">
                <svg width="100%" height="74" viewBox="0 0 340 74" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points="14,58 96,44 178,14 260,26 326,20" fill="none" stroke="#C81E63" strokeWidth="2.4" strokeLinejoin="round" />
                  <circle cx="14" cy="58" r="5.5" fill="#C81E63" />
                  <circle cx="178" cy="14" r="5.5" fill="#C81E63" />
                  <circle cx="326" cy="20" r="5.5" fill="#C81E63" />
                </svg>
                <div className="arclabels"><span>Curiosity</span><span>Surprise</span><span>Belonging</span></div>
              </div>
              <p>
                Open with a loop you refuse to close. Land the surprise on the mechanism.{' '}
                <b>Close on something the viewer recognises in themselves.</b> That is what gets forwarded.
              </p>
            </div>

            <div className="card tc">
              <p className="tl">Pacing</p>
              <h4>Cut every 2–3 seconds</h4>
              <div className="arcwrap">
                <svg width="100%" height="74" viewBox="0 0 340 74" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" y1="52" x2="340" y2="52" stroke="#EFE6E9" strokeWidth="2" />
                  <g fill="#E0431A">
                    {[6, 24, 45, 63, 84, 104, 122, 143, 162, 181, 202, 221, 240, 260, 281, 300, 320].map((x) => (
                      <rect key={x} x={x} y="24" width="3" height="28" />
                    ))}
                  </g>
                </svg>
                <div className="arclabels"><span>0s</span><span>≈18 cuts</span><span>45s</span></div>
              </div>
              <p>
                <b>No single shot longer than 4 seconds.</b> The 10–30s explanation is where drafts consistently drift.
                Break it into five inserts rather than one long take.
              </p>
            </div>

            <div className="card tc">
              <p className="tl">Visual format</p>
              <h4>Mixed, anchored on a talking head</h4>
              <div className="arcwrap">
                <svg width="100%" height="74" viewBox="0 0 340 74" preserveAspectRatio="none" aria-hidden="true">
                  <rect x="0" y="26" width="15" height="26" fill="#C81E63" />
                  <rect x="15" y="26" width="59" height="26" fill="#E8447F" />
                  <rect x="74" y="26" width="151" height="26" fill="#F59E3C" />
                  <rect x="225" y="26" width="75" height="26" fill="#E0431A" />
                  <rect x="300" y="26" width="40" height="26" fill="#E8447F" />
                </svg>
                <div className="arclabels"><span>Head</span><span>B-roll VO</span><span>Head</span></div>
              </div>
              <p>
                Talking head for the hook, setup and close. <b>B-roll over voiceover for the explanation only.</b>{' '}
                Text-only underperforms in this niche, because a face is doing the trust work.
              </p>
            </div>
          </div>
        </div>

        <div className="sec">
          <div className="duo">
            <div className="card tc">
              <p className="tl">Approved CTA line</p>
              <p className="ctaline">&quot;<em>Would you try this?</em>&quot;</p>
              <p>
                On screen and spoken, at 40 seconds. Not &quot;save this post&quot;, not &quot;follow for more&quot;.{' '}
                <b>A question invites a reply, and replies are what the algorithm reads as a share signal</b> in this niche.
              </p>
            </div>
            <div className="card tc">
              <p className="tl">Hashtags</p>
              <h4>Six, not sixteen</h4>
              <div className="tags">
                {['#skincare', '#skintok', '#niacinamide', '#skinbarrier', '#skincareroutine', '#glowup'].map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>
              <p style={{ marginTop: 16 }}>
                Two broad, two niche, two ingredient-specific.{' '}
                <b>The ingredient tags are where this niche&apos;s engaged audience browses.</b>
              </p>
            </div>
          </div>
        </div>

        <div className="sec">
          <h2>Reference set</h2>
          <div className="refs">
            {REFS.map((r) => (
              <div className="card ref" key={r.title}>
                <div className="refthumb" style={{ background: r.grad }} />
                <div>
                  <p className="rt">{r.title}</p>
                  <p className="rm">{r.meta}</p>
                  <span className="rmatch">{r.match}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="foot">
        <p>
          A single <b>soft window key</b> carries four of the five scenes. The one break at 30s is what makes the proof
          read as a different day. <b>Shot and light patterns are human-tagged</b> in the pattern library; timings are
          derived from transcript analysis across 142 public Reels.
        </p>
        <Link className="btn-dark" to="/upload">Audit the draft once shot →</Link>
      </div>
    </>
  )
}
