import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import Pills from '../components/Pills.jsx'
import { useBrief } from '../store.jsx'
import { generateBrief, DemoModeUnavailable } from '../api.js'

export default function Brief() {
  const { brief } = useBrief()
  const { getToken } = useAuth()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null })

    generateBrief(brief, getToken)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null })
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
    // Regenerate only when the campaign inputs actually change, not on
    // every render - getToken is a new function reference from useAuth()
    // on most renders, and isn't itself something that should retrigger
    // generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.niche, brief.platform, brief.audience, brief.objectives, brief.tone])

  return (
    <>
      <Mesh />
      <Nav
        variant="app"
        links={[
          { label: 'Market', to: '/market' },
          { label: 'Brief', to: '/brief', on: true },
          { label: 'Inputs', to: '/inputs' }
        ]}
      />

      <div className="wrap" style={{ paddingTop: 34 }}>
        <Pills brief={brief} left />

        {state.status === 'loading' && (
          <div className="sec" style={{ marginTop: 40 }}>
            <div className="card loadcard">
              <div className="dots" aria-hidden="true"><i /><i /><i /></div>
              <p className="lmsg" role="status">
                Reasoning over structural patterns from top-performing {brief.niche} content on {brief.platform}…
              </p>
              <p className="lsub">Usually takes 10&ndash;20 seconds.</p>
            </div>
          </div>
        )}

        {state.status === 'demo' && (
          <div className="sec" style={{ marginTop: 40 }}>
            <div className="card" style={{ padding: '40px' }}>
              <p style={{ fontWeight: 510, fontSize: 15.5 }}>This is a preview, not a live brief</p>
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
          <div className="sec" style={{ marginTop: 40 }}>
            <div className="card" style={{ padding: '40px', background: 'var(--bad-bg)' }}>
              <p style={{ color: 'var(--bad)', fontWeight: 510, fontSize: 15.5 }}>Couldn&apos;t generate a brief</p>
              <p style={{ color: 'var(--ink-2)', marginTop: 8, fontSize: 13.5 }}>{state.error.message}</p>
              <p style={{ marginTop: 20 }}>
                <Link className="btn-dark" to="/vision">Back to creative direction →</Link>
              </p>
            </div>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            {!state.data.niche_recognized && (
              <div className="sec" style={{ marginTop: 40 }}>
                <div className="card" style={{ padding: '18px 24px', background: 'var(--warn-bg)' }}>
                  <p style={{ fontSize: 13.5, color: 'var(--warn)' }}>
                    <b>&quot;{brief.niche}&quot;</b> isn&apos;t in the pattern library yet - this brief draws on general
                    evidence across niches rather than {brief.niche}-specific data. It&apos;ll get more specific once
                    real {brief.niche} content has been measured.
                  </p>
                </div>
              </div>
            )}

            <div className="sec" style={{ marginTop: 40 }}>
              <h2>Script outline</h2>

              <div className="card" style={{ padding: '24px 26px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
                  <div>
                    <p className="tl">Format</p>
                    <p style={{ marginTop: 6, fontSize: 14.5 }}>{state.data.content_format}</p>
                  </div>
                  <div>
                    <p className="tl">Pacing</p>
                    <p style={{ marginTop: 6, fontSize: 14.5 }}>{state.data.pacing}</p>
                  </div>
                  <div>
                    <p className="tl">Visual style</p>
                    <p style={{ marginTop: 6, fontSize: 14.5 }}>{state.data.visual_style}</p>
                  </div>
                  <div>
                    <p className="tl">Audio direction</p>
                    <p style={{ marginTop: 6, fontSize: 14.5 }}>{state.data.audio_direction}</p>
                  </div>
                </div>
              </div>

              {state.data.script_outline.map((beat, i) => (
                <div
                  className="card"
                  key={i}
                  style={{ padding: '18px 24px', display: 'flex', gap: 22, alignItems: 'baseline', marginBottom: 10 }}
                >
                  <p className="mono" style={{ fontSize: 14, color: 'var(--purple-deep)', fontWeight: 560, flex: '0 0 110px' }}>
                    {beat.timestamp}
                  </p>
                  <p style={{ fontSize: 14.5 }}>{beat.action}</p>
                </div>
              ))}
            </div>

            <div className="sec">
              <h2>Hook options</h2>
              <div className="hooks">
                {state.data.hook_options.map((line, i) => (
                  <div className="card hook" key={i}>
                    <p className="hn">Option {String(i + 1).padStart(2, '0')}</p>
                    <p className="hl">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="sec">
              <div className="duo">
                <div className="card tc">
                  <p className="tl">Approved CTA line</p>
                  <p className="ctaline">&quot;{state.data.cta}&quot;</p>
                </div>
                <div className="card tc">
                  <p className="tl">Hashtags</p>
                  <div className="tags">
                    {state.data.hashtags.map((t) => (
                      <span className="tag" key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="foot">
        <p>
          Generated by reasoning over structural patterns retrieved from top-performing {brief.niche} content on{' '}
          {brief.platform}, matched to this campaign&apos;s goal and audience.
        </p>
      </div>
    </>
  )
}
