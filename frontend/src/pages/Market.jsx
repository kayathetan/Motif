import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'
import { fetchIntelligence, DemoModeUnavailable } from '../api.js'
import { isDemo } from '../demo.js'
import { capitalize, formatLabel } from '../format.js'

/**
 * Market intelligence for a category - real data from GET
 * /api/intelligence/{niche}/{platform}, not the fabricated competitor/CPM
 * figures this page used to show. Reuses the same card/chart CSS as
 * before; the numbers are just aggregated from stored patterns now
 * instead of hardcoded, and sections with no real backing (named
 * competitor share, view-volume trends, CPM economics) are gone rather
 * than kept as decoration.
 *
 * Chart palette is --c-1 #6D28D9 / --c-2 #C2410C, validated against the
 * light surface (normal-vision dE 33.9, protan 31.0, both >= 3:1).
 */
export default function Market() {
  const { brief } = useBrief()
  const { getToken } = useAuth()
  const location = useLocation()
  // Set by Brief.jsx/SavedBrief.jsx's "See full market breakdown" button -
  // arriving here from a brief that already exists means "turn this into
  // a brief" below is a non sequitur, not a next step.
  const cameFromBrief = Boolean(location.state?.fromBrief)
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null })

    fetchIntelligence(brief.niche, brief.platform, getToken)
      .then((data) => {
        if (cancelled) return
        setState(data ? { status: 'ready', data, error: null } : { status: 'empty', data: null, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof DemoModeUnavailable) {
          setState({ status: 'demo', data: null, error })
        } else {
          setState({ status: 'error', data: null, error })
        }
      })

    return () => {
      cancelled = true
    }
    // getToken is a new function reference from useAuth() on most
    // renders and isn't itself something that should retrigger the fetch
    // - see the same note in Brief.jsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.niche, brief.platform])

  const data = state.data
  const contentTypeMax = data ? Math.max(...data.top_content_types.map((c) => c.percent)) : 0
  const ctaMax = data ? Math.max(...data.top_cta_types.map((c) => c.percent)) : 0

  return (
    <>
      <Mesh />
      <Nav variant="app" />

      <div className="wrap" style={{ paddingTop: 28 }}>
        <Link className="btn-ghost" to="/dashboard">← Back to dashboard</Link>
      </div>

      <div className="hero" style={{ paddingTop: 36 }}>
        <p className="kick">Market intelligence · {formatLabel(brief.niche)} · {brief.platform}</p>
        <h1>What&apos;s actually working<br />in your category</h1>
        <p className="sub">
          Structural patterns pulled from top-performing {formatLabel(brief.niche)} content, so the brief your team
          writes is <b>grounded in what&apos;s measured</b> rather than a guess.
        </p>
        {data && (
          <p className="sub" style={{ marginTop: 10, fontSize: 13 }}>
            Based on {data.structural_benchmark.cta_total_count} measured {formatLabel(brief.niche)} videos on{' '}
            {brief.platform}.
          </p>
        )}
      </div>

      <div className="wrap">
        {state.status === 'loading' && (
          <div className="sec" style={{ marginTop: 52 }}>
            <div className="card loadcard">
              <div className="dots" aria-hidden="true"><i /><i /><i /></div>
              <p className="lmsg" role="status">Aggregating patterns for {formatLabel(brief.niche)}…</p>
              <p className="lsub">Reading every stored pattern in the category.</p>
            </div>
          </div>
        )}

        {/* This page's data is real in demo mode - the intelligence route
            serves anonymous callers. Only brief generation needs an
            account, so say that here rather than gating the page. The
            'demo' status below is now a safety net: it can only fire if
            fetchIntelligence starts throwing DemoModeUnavailable again. */}
        {isDemo() && state.status === 'ready' && (
          <div className="sec" style={{ marginTop: 52, marginBottom: -28 }}>
            <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, flex: '1 1 34ch' }}>
                You&apos;re in demo mode. These figures are live, aggregated from the real pattern library.
                Generating a brief needs an account.
              </p>
              <Link className="btn-dark" to="/signup" style={{ flex: '0 0 auto' }}>Create an account →</Link>
            </div>
          </div>
        )}

        {state.status === 'demo' && (
          <div className="sec" style={{ marginTop: 52 }}>
            <div className="card" style={{ padding: 40 }}>
              <p style={{ fontSize: 15.5, fontWeight: 510 }}>This is a preview, not live intelligence</p>
              <p style={{ color: 'var(--ink-2)', marginTop: 8, fontSize: 13.5, maxWidth: '60ch' }}>
                {state.error.message}
              </p>
              <p style={{ marginTop: 20 }}>
                <Link className="btn-primary" to="/signup">Create an account →</Link>
              </p>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="sec" style={{ marginTop: 52 }}>
            <div className="card" style={{ padding: 40, background: 'var(--bad-bg)' }}>
              <p style={{ color: 'var(--bad)', fontWeight: 510, fontSize: 15.5 }}>Couldn&apos;t load market intelligence</p>
              <p style={{ color: 'var(--ink-2)', marginTop: 8, fontSize: 13.5 }}>{state.error.message}</p>
            </div>
          </div>
        )}

        {state.status === 'empty' && (
          <div className="sec" style={{ marginTop: 52 }}>
            <div className="card" style={{ padding: 40 }}>
              <p style={{ fontSize: 15.5, fontWeight: 510 }}>
                No data yet for {formatLabel(brief.niche)} on {brief.platform}
              </p>
              <p style={{ color: 'var(--ink-2)', marginTop: 8, fontSize: 13.5, maxWidth: '60ch' }}>
                We haven&apos;t analyzed enough {formatLabel(brief.niche)} content yet to show results here. Check
                back soon, or try a broader category.
              </p>
            </div>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            {/* headline numbers */}
            <div className="sec" style={{ marginTop: 52 }}>
              <div className="statrow">
                <div className="card stat">
                  <p className="sl">Dominant format</p>
                  <p className="sv" style={{ fontSize: 26 }}>{capitalize(data.dominant_format)}</p>
                  <p className="sn">{data.dominant_format_percent}% of top performers</p>
                </div>
                <div className="card stat">
                  <p className="sl">Avg hook delivery</p>
                  <p className="sv">{data.avg_hook_delivery_seconds}<span className="su">sec</span></p>
                </div>
                <div className="card stat">
                  <p className="sl">Avg views</p>
                  <p className="sv">{(data.avg_views / 1000).toFixed(0)}<span className="su">K</span></p>
                </div>
                <div className="card stat">
                  <p className="sl">Top emotional trigger</p>
                  <p className="sv" style={{ fontSize: 26 }}>{capitalize(data.top_emotional_trigger)}</p>
                </div>
              </div>
            </div>

            {/* content type + cta breakdowns */}
            <div className="sec">
              <div className="duo">
                <div className="card chartcard">
                  <div className="chart-h">
                    <h3>Content types in play</h3>
                    <p className="cn">% of top performers</p>
                  </div>
                  <div className="hbars">
                    {data.top_content_types.map((c) => (
                      <div className="hbar" key={c.content_type}>
                        <p className="hl">{formatLabel(c.content_type)}</p>
                        <div className="ht">
                          <div className="hf" style={{ width: `${(c.percent / contentTypeMax) * 100}%` }} />
                        </div>
                        <p className="hv">{c.percent}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card chartcard">
                  <div className="chart-h">
                    <h3>CTA types in play</h3>
                    <p className="cn">% of top performers</p>
                  </div>
                  <div className="hbars">
                    {data.top_cta_types.map((c) => (
                      <div className="hbar" key={c.cta}>
                        <p className="hl">{formatLabel(c.cta)}</p>
                        <div className="ht">
                          <div className="hf" style={{ width: `${(c.percent / ctaMax) * 100}%` }} />
                        </div>
                        <p className="hv">{c.percent}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* structural benchmark */}
            <div className="sec">
              <h2>Structural benchmark</h2>
              <div className="statrow">
                <div className="card stat">
                  <p className="sl">Hook lands under</p>
                  <p className="sv">{data.structural_benchmark.hook_under_seconds}<span className="su">sec</span></p>
                </div>
                <div className="card stat">
                  <p className="sl">Payoff by</p>
                  <p className="sv">{data.structural_benchmark.payoff_before_seconds}<span className="su">sec</span></p>
                </div>
                <div className="card stat">
                  <p className="sl">CTA lands at</p>
                  <p className="sv">
                    {data.structural_benchmark.cta_after_percent != null
                      ? <>{data.structural_benchmark.cta_after_percent}<span className="su">%</span></>
                      : <span style={{ fontSize: 15, color: 'var(--ink-2)' }}>not detected</span>}
                  </p>
                  {/* The average counts only videos with a detected verbal CTA,
                      which can be a small fraction of the category - and the
                      CTA-type chart above often shows most videos have no CTA
                      at all. Printing the sample size stops those two true
                      numbers reading as a contradiction. */}
                  {data.structural_benchmark.cta_measured_count != null && (
                    <p className="sn">
                      {data.structural_benchmark.cta_measured_count === 0
                        ? `no verbal CTA found in ${data.structural_benchmark.cta_total_count}`
                        : `from ${data.structural_benchmark.cta_measured_count} of ${data.structural_benchmark.cta_total_count} measured`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* what's winning / saturated */}
            <div className="sec">
              <div className="duo">
                <div className="card tc">
                  <p className="tl" style={{ color: 'var(--purple-deep)' }}>What&apos;s winning</p>
                  <p style={{ marginTop: 10 }}>{data.whats_winning}</p>
                </div>
                <div className="card tc">
                  <p className="tl">What&apos;s saturated</p>
                  <p style={{ marginTop: 10 }}>{data.whats_saturated}</p>
                </div>
              </div>
            </div>

            {!cameFromBrief && (
              <div className="sec">
                <div className="card tc" style={{ textAlign: 'center', padding: '44px 40px' }}>
                  <p className="tl" style={{ color: 'var(--purple-deep)' }}>Act on it</p>
                  <h4 style={{ fontSize: 28, letterSpacing: '-.03em', marginTop: 12 }}>
                    Turn this into a brief
                  </h4>
                  <p style={{ marginTop: 24 }}>
                    <Link className="btn-primary" to={isDemo() ? '/signup' : '/inputs'}>
                      {isDemo() ? 'Create an account to build a brief →' : 'Build a brief from this →'}
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {state.status === 'ready' && (
        <div className="foot">
          <p>Based on real, published {formatLabel(brief.niche)} content on {brief.platform} - not projections.</p>
          {/* Arriving here from an already-built brief (see the "See full
              market breakdown" button on BriefContent.jsx): that brief
              already exists, so "go see the brief" reads as broken, not
              helpful - same reasoning as hiding "Act on it" above. */}
          {!cameFromBrief && <Link className="btn-dark" to="/brief">See the brief →</Link>}
        </div>
      )}
    </>
  )
}
