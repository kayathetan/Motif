import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

const SAMPLE_SCRIPT =
  'Hey guys! So today I wanted to talk about my skin, because honestly a lot of you have been asking what I changed. ' +
  'So basically about three weeks ago I started doing something a bit different, and I think it actually worked. Look at this.'

const SAMPLE_INTENT =
  'Briefed to read as a peer recommendation rather than advertising, with the objective of driving shares to someone ' +
  'with the same concern.'

export default function Upload() {
  const navigate = useNavigate()
  const { brief } = useBrief()
  const [script, setScript] = useState(SAMPLE_SCRIPT)
  const [intent, setIntent] = useState(SAMPLE_INTENT)
  const [link, setLink] = useState('')
  const [duration, setDuration] = useState('0:45')

  const submit = (e) => {
    e.preventDefault()
    navigate('/analyse')
  }

  return (
    <>
      <Mesh />
      <Nav variant="app" links={[{ label: 'Inputs', to: '/inputs' }, { label: 'Direction', to: '/choose' }]} />

      <div className="sheet wide">
        <div className="formcard">
          <h2>Submit the draft</h2>
          <p className="lede">
            Paste a link or the script. Motif reads <b>spoken timing</b>: where the payoff lands, how long the curiosity
            gap holds, when the CTA arrives. It then measures that against the top quartile in your niche.
          </p>

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="link">Paste a link</label>
              <input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="instagram.com/reel/… or a Shorts / TikTok URL"
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="script">Or paste the script or transcript</label>
              <textarea id="script" style={{ minHeight: 150 }} value={script} onChange={(e) => setScript(e.target.value)} />
              <p className="hint">
                Timestamps improve accuracy but are not required. Motif estimates timing from speech rate where they are
                absent.
              </p>
            </div>

            <div className="field">
              <label htmlFor="intent">Original creative intent</label>
              <textarea id="intent" value={intent} onChange={(e) => setIntent(e.target.value)} />
              <p className="hint">
                Motif scores execution against <b>your</b> stated intent rather than a generic ideal. That distinction
                separates &quot;wrong structure&quot; from &quot;right structure, wrong objective&quot;.
              </p>
            </div>

            <div className="field">
              <label htmlFor="len">Duration</label>
              <input id="len" value={duration} onChange={(e) => setDuration(e.target.value)} autoComplete="off" />
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit">Run audit →</button>
              <p className="alt">
                Benchmarked against <b>142 {brief.niche} Reels</b>, top quartile by shares.
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
