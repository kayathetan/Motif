import { useState } from 'react'
import { Link } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

/**
 * Market intelligence for a category.
 *
 * Chart palette is --c-1 #6D28D9 / --c-2 #C2410C, validated against the light
 * surface (normal-vision dE 33.9, protan 31.0, both >= 3:1). Amber was rejected:
 * only dE 11.2 from orange, under the 15 floor.
 *
 * Every mark carries a direct label, so identity is never colour-alone.
 */

/* Share of attention. One measure across named entities, so no legend:
   the entities are labelled and "you" is the only recoloured row. */
const SHARE = [
  { name: 'The Ordinary', pct: 18.4 },
  { name: 'CeraVe', pct: 14.1 },
  { name: 'Paula’s Choice', pct: 9.7 },
  { name: 'Acme Skincare', pct: 6.2, you: true },
  { name: 'Beauty of Joseon', pct: 5.8 },
  { name: 'Everyone else', pct: 45.8 },
]

/* Monthly attention volume, millions of views in-category. */
const VOLUME = [
  { m: 'Oct', v: 842 }, { m: 'Nov', v: 878 }, { m: 'Dec', v: 1010 },
  { m: 'Jan', v: 1124 }, { m: 'Feb', v: 1068 }, { m: 'Mar', v: 1142 },
  { m: 'Apr', v: 1196 }, { m: 'May', v: 1210 }, { m: 'Jun', v: 1288 },
  { m: 'Jul', v: 1334 }, { m: 'Aug', v: 1376 }, { m: 'Sep', v: 1422 },
]

/* Format migration. Polarity, so a diverging pair around a neutral zero. */
const MIGRATION = [
  { label: 'Result-first open', d: 34 },
  { label: 'Creator-to-camera', d: 21 },
  { label: 'On-screen captions', d: 17 },
  { label: 'Ingredient explainer', d: 6 },
  { label: 'Studio product shot', d: -19 },
  { label: 'Voiceover-only B-roll', d: -26 },
  { label: 'Long intro / greeting', d: -41 },
]

const REWARDS = [
  ['01', 'Payoff inside two seconds', 'The single strongest signal in the category. Videos that show the result before any framing hold 2.4x the audience at ten seconds.', 'rising'],
  ['02', 'A withheld variable', 'Naming what changed without explaining why sustains watch time to the eight-second mark. Closing the loop early costs roughly a third of viewers.', 'rising'],
  ['03', 'Cuts every two to three seconds', 'Median shot length in the top quartile has fallen from 4.1s to 2.6s over four quarters.', 'rising'],
  ['04', 'Question-form CTA', 'Out-shares an instruction 3:1 here, because replies are what the ranking reads as a share signal.', 'holding'],
  ['05', 'Polished studio production', 'Higher production value now correlates negatively with shares in this category. It reads as advertising.', 'fading'],
]

const CASE = [
  ['What it costs to guess', 'A brief built on instinct',
    <>Ten creators briefed without structure produce ten different structures, and you only learn which worked after the spend. At a $14.60 paid CPM, <b>a structurally weak video is a media budget spent on reach that does not convert.</b></>],
  ['What it costs to know', 'A brief built on the category',
    <>Motif prices the same decision at the research stage. <b>Organic attention in this category costs $2.40 per thousand views against $14.60 paid</b> — structure is the lever that moves spend from the second number to the first.</>],
  ['Where the return sits', 'Not in more content',
    <>Category volume is up 18.4% in a quarter while saturation is up 31%. <b>Publishing more is getting more expensive, not less</b> The return is in a higher hit rate per post, which is a structural problem, not a creative one.</>],
]

export default function Market() {
  const { brief } = useBrief()
  const [hover, setHover] = useState(null)

  const shareMax = Math.max(...SHARE.map((s) => s.pct))
  const volMax = Math.max(...VOLUME.map((v) => v.v))
  const migMax = Math.max(...MIGRATION.map((m) => Math.abs(m.d)))

  return (
    <>
      <Mesh />
      <Nav
        variant="app"
        action={{ to: '/brief', label: 'Build a brief' }}
        links={[
          { label: 'Market', to: '/market', on: true },
          { label: 'Brief', to: '/brief' },
          { label: 'Analyse', to: '/upload' },
          { label: 'Inputs', to: '/inputs' },
        ]}
      />

      <div className="hero" style={{ paddingTop: 72 }}>
        <p className="kick">Market intelligence · {brief.niche} · {brief.platform}</p>
        <h1>What your category&apos;s<br />attention costs</h1>
        <p className="sub">
          Attention is a market with a supply, a growth rate and a clearing price. Motif measures all three for your
          category, so the brief your team writes is <b>a position in that market</b> rather than an opinion about it.
        </p>
      </div>

      <div className="wrap">

        {/* headline numbers: single figures, so tiles rather than charts */}
        <div className="sec" style={{ marginTop: 52 }}>
          <div className="statrow">
            <div className="card stat">
              <p className="sl">Category attention · 30d</p>
              <p className="sv">1.42<span className="su">B views</span></p>
              <p className="delta up">▲ 18.4% vs last quarter</p>
            </div>
            <div className="card stat">
              <p className="sl">Cost per 1,000 views</p>
              <p className="sv">$2.40<span className="su">organic</span></p>
              <p className="sn">Against <b>$14.60 paid</b>. A 6.1x spread, and the reason structure is a budget question</p>
            </div>
            <div className="card stat">
              <p className="sl">Saturation index</p>
              <p className="sv">3.1<span className="su">posts / 1k views</span></p>
              <p className="delta down">▲ 31% — crowding faster than demand</p>
            </div>
            <div className="card stat">
              <p className="sl">Your share of attention</p>
              <p className="sv">6.2<span className="su">%</span></p>
              <p className="delta flat">4th of 5 named brands</p>
            </div>
          </div>
        </div>

        {/* share of attention */}
        <div className="sec">
          <div className="card chartcard">
            <div className="chart-h">
              <h3>Share of category attention</h3>
              <p className="cn">% of in-category views · last 30 days</p>
            </div>
            <div className="hbars">
              {SHARE.map((s) => (
                <div className={s.you ? 'hbar you' : 'hbar'} key={s.name}>
                  <p className="hl">{s.name}{s.you ? ' (you)' : ''}</p>
                  <div className="ht">
                    <div className="hf" style={{ width: `${(s.pct / shareMax) * 100}%` }} />
                  </div>
                  <p className="hv">{s.pct.toFixed(1)}%</p>
                </div>
              ))}
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--c-2)' }} />Acme Skincare</span>
              <span><i style={{ background: 'var(--c-1)' }} />Other brands in category</span>
            </div>
          </div>
        </div>

        {/* volume over time + format migration */}
        <div className="sec">
          <div className="duo">
            <div className="card chartcard">
              <div className="chart-h">
                <h3>Attention volume, 12 months</h3>
                <p className="cn">millions of views</p>
              </div>
              <div className="vbars">
                {VOLUME.map((v, i) => (
                  <div
                    className={i === VOLUME.length - 1 ? 'vbcol last' : 'vbcol'}
                    key={v.m}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {hover === i && <span className="vbtip">{v.m} · {v.v}M</span>}
                    <div className="vbf" style={{ height: `${(v.v / volMax) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div className="vbaxis">
                {VOLUME.map((v, i) => (
                  <span key={v.m}>{i % 2 === 0 ? v.m : ''}</span>
                ))}
              </div>
              <div className="legend">
                <span><i style={{ background: 'var(--c-1)' }} />Monthly views</span>
                <span><i style={{ background: 'var(--c-2)' }} />Current month · 1,422M</span>
              </div>
            </div>

            <div className="card chartcard">
              <div className="chart-h">
                <h3>Format migration</h3>
                <p className="cn">change in share, 4 quarters</p>
              </div>
              <div className="dbars">
                {MIGRATION.map((m) => (
                  <div className="dbar" key={m.label}>
                    <p className="dl">{m.label}</p>
                    <div className="dtrack">
                      <div
                        className={m.d > 0 ? 'dfill pos' : 'dfill neg'}
                        style={{ width: `${(Math.abs(m.d) / migMax) * 50}%` }}
                      />
                    </div>
                    <p className={m.d > 0 ? 'dv pos' : 'dv neg'}>{m.d > 0 ? '+' : ''}{m.d}%</p>
                  </div>
                ))}
              </div>
              <div className="legend">
                <span><i style={{ background: 'var(--c-1)' }} />Gaining share</span>
                <span><i style={{ background: 'var(--c-2)' }} />Losing share</span>
              </div>
            </div>
          </div>
        </div>

        {/* what the market rewards */}
        <div className="sec">
          <h2>What this market rewards now</h2>
          <div className="card chartcard">
            <div className="rewards">
              {REWARDS.map(([n, title, body, state]) => (
                <div className="reward" key={n}>
                  <p className="rn">{n}</p>
                  <div>
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </div>
                  <p className={`rp ${state}`}>{state}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* the business case */}
        <div className="sec">
          <h2>Why this is a business number</h2>
          <div className="card case">
            {CASE.map(([kicker, title, body]) => (
              <div key={title}>
                <p className="cl">{kicker}</p>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec">
          <div className="card tc" style={{ textAlign: 'center', padding: '44px 40px' }}>
            <p className="tl" style={{ color: 'var(--purple-deep)' }}>Act on it</p>
            <h4 style={{ fontSize: 28, letterSpacing: '-.03em', marginTop: 12 }}>
              Turn this market read into a brief
            </h4>
            <p style={{ maxWidth: '54ch', margin: '12px auto 0' }}>
              The five patterns above become the structure of your next production brief, timestamped and shootable.
            </p>
            <p style={{ marginTop: 24 }}>
              <Link className="btn-primary" to="/vision">Build a brief from this →</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="foot">
        <p>
          Market figures are derived from public view, share and post counts across the {brief.niche} category on{' '}
          {brief.platform}, sampled daily. <b>Cost per thousand views compares organic reach against the category&apos;s
          median paid CPM</b>; saturation is posts published per thousand category views.
        </p>
        <Link className="btn-dark" to="/brief">See the brief →</Link>
      </div>
    </>
  )
}
