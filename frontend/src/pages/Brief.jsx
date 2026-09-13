import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import Pills from '../components/Pills.jsx'
import BriefContent from '../components/BriefContent.jsx'
import { useBrief } from '../store.jsx'
import { generateBrief, fetchIntelligence, DemoModeUnavailable } from '../api.js'

export default function Brief() {
  const { brief } = useBrief()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  // Separate from `state`: the market snapshot is supplementary, not part
  // of what "the brief is ready" means, and its own fetch failing (or the
  // niche having no stored patterns yet) shouldn't block or blank the
  // actual brief. See BriefContent's docstring.
  const [intelligence, setIntelligence] = useState({ status: 'loading', data: null })

  useEffect(() => {
    // AbortController, not just a `cancelled` flag: this request has a
    // real side effect on the backend (it saves the brief to history), so
    // an unmount needs to actually cancel the network call, not just
    // ignore its result once it lands. Otherwise React 18 StrictMode's
    // dev-only double-invoked effect fires this twice in a row - both
    // requests complete, both save - so what looks like "generated once"
    // shows up twice in the dashboard's previous-briefs list.
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })

    generateBrief(brief, getToken, controller.signal)
      .then((data) => {
        setState({ status: 'ready', data, error: null })
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error instanceof DemoModeUnavailable) {
          setState({ status: 'demo', data: null, error })
        } else {
          setState({ status: 'error', data: null, error })
        }
      })

    return () => {
      controller.abort()
    }
    // Regenerate only when the campaign inputs actually change, not on
    // every render - getToken is a new function reference from useAuth()
    // on most renders, and isn't itself something that should retrigger
    // generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.niche, brief.platform, brief.audience, brief.objectives, brief.tone])

  useEffect(() => {
    let cancelled = false
    setIntelligence({ status: 'loading', data: null })

    // A GET with no side effect, unlike generateBrief above - no need for
    // an AbortController here, just ignore a late result on unmount.
    fetchIntelligence(brief.niche, brief.platform, getToken)
      .then((data) => {
        if (!cancelled) setIntelligence(data ? { status: 'ready', data } : { status: 'empty', data: null })
      })
      .catch(() => {
        if (!cancelled) setIntelligence({ status: 'error', data: null })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief.niche, brief.platform])

  return (
    <>
      <div className="no-print">
        <Mesh />
        <Nav variant="app" />
      </div>

      <div className="wrap" style={{ paddingTop: 34 }}>
        <Pills brief={brief} left />

        {state.status === 'ready' && (
          <div className="resultbar no-print">
            <Link className="btn-ghost" to="/dashboard">← Back to dashboard</Link>
            <button className="btn-dark" type="button" onClick={() => window.print()}>Download as PDF ⭳</button>
          </div>
        )}

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
                <Link className="btn-dark" to="/inputs">Back to inputs →</Link>
              </p>
            </div>
          </div>
        )}

        {state.status === 'ready' && (
          <BriefContent
            data={state.data}
            niche={brief.niche}
            intelligence={intelligence}
            onViewMarket={() => navigate('/market')}
          />
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
