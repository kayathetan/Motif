import { Link, useNavigate } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import ChipSet from '../components/ChipSet.jsx'
import { useBrief } from '../store.jsx'

const TONE = ['Measured', 'High tempo', 'Warm, personal', 'Clinical, factual', 'Humorous']
const RESOURCES = ['Phone only', 'Natural window light', 'Ring light', 'Tripod', 'A camera operator', 'Second location']
const DURATIONS = ['0:15', '0:30', '0:45', '1:00', 'Not sure yet']

const SAMPLE_VISION =
  'This should read as a genuine three-week before-and-after from a real customer, not a product ad. ' +
  'Quiet and credible, closer to a testimonial than a campaign. The product can appear but must not lead.'

export default function Vision() {
  const navigate = useNavigate()
  const { brief, update } = useBrief()

  const submit = (e) => {
    e.preventDefault()
    navigate('/brief')
  }

  return (
    <>
      <Mesh />
      <Nav variant="app" links={[{ label: 'Inputs', to: '/inputs' }, { label: 'Direction', to: '/choose' }]} />

      <div className="sheet wide">
        <div className="formcard">
          <p className="demo-note">New content · {brief.niche} · {brief.platform.toLowerCase()}</p>
          <h2>Creative direction</h2>
          <p className="lede">
            Motif supplies the structure. <b>You supply the creative intent.</b> The more specific this is, the less
            generic the brief returns. Only the first field is required.
          </p>

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="vision">Your creative vision</label>
              <textarea
                id="vision"
                style={{ minHeight: 140 }}
                value={brief.vision || SAMPLE_VISION}
                onChange={(e) => update({ vision: e.target.value })}
                placeholder="What the piece is, why now, and what it should make the viewer feel."
              />
              <p className="hint">
                This shapes tone, hook framing and how hard the CTA pushes.{' '}
                <b>&quot;Understated and credible&quot; and &quot;loud and punchy&quot; produce different structures</b> for
                the same niche.
              </p>
            </div>

            <div className="field">
              <label htmlFor="topic">Subject in one line</label>
              <input
                id="topic"
                value={brief.topic || 'one ingredient that fixed my skin barrier in three weeks'}
                onChange={(e) => update({ topic: e.target.value })}
                autoComplete="off"
              />
              <p className="hint">The sentence a viewer would use to describe it afterwards.</p>
            </div>

            <div className="field">
              <label>
                Tone{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-2)' }}>(select all that apply)</span>
              </label>
              <ChipSet multi name="tone" options={TONE} value={brief.tone} onChange={(v) => update({ tone: v })} />
            </div>

            <div className="field">
              <label>
                Production resources available{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-2)' }}>(select all that apply)</span>
              </label>
              <ChipSet multi name="resources" options={RESOURCES} value={brief.resources} onChange={(v) => update({ resources: v })} />
              <p className="hint">
                Motif only specifies shots the production can actually deliver.{' '}
                <b>No tripod means no locked-off shots in the brief.</b>
              </p>
            </div>

            <div className="field">
              <label>Target duration</label>
              <ChipSet name="duration" options={DURATIONS} value={brief.duration} onChange={(v) => update({ duration: v })} />
            </div>

            <div className="field">
              <label htmlFor="musts">
                Mandatory inclusions <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                id="musts"
                placeholder="Product placement, approved claims, a line that must appear verbatim, anything legal has ruled out…"
              />
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit">Build my brief →</button>
              <p className="alt">Returns in roughly 20 seconds. <Link to="/choose">Change workflow</Link></p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
