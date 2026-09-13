import { useNavigate } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import ChipSet from '../components/ChipSet.jsx'
import { useBrief } from '../store.jsx'

const PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts']
const OBJECTIVES = ['Shares', 'Reach', 'Retention', 'Conversions']
const TONE = ['Measured', 'High tempo', 'Warm, personal', 'Clinical, factual', 'Humorous']
const RESOURCES = ['Phone only', 'Natural window light', 'Ring light', 'Tripod', 'A camera operator', 'Second location']
const DURATIONS = ['0:15', '0:30', '0:45', '1:00', 'Not sure yet']

const SAMPLE_VISION =
  'This should read as a genuine three-week before-and-after from a real customer, not a product ad. ' +
  'Quiet and credible, closer to a testimonial than a campaign. The product can appear but must not lead.'

/**
 * One-time step from the dashboard into a brief: campaign inputs (what
 * slice of the pattern library to measure against) and creative direction
 * (what the piece actually is) used to live on separate pages (Inputs,
 * then Choose, then Vision) - collapsed into a single form since there was
 * nothing to decide between at the Choose step once the audit workflow was
 * removed, and nothing meaningfully separates "inputs" from "creative
 * direction" for the person filling this in. One submit, straight to the
 * brief.
 */
export default function Inputs() {
  const navigate = useNavigate()
  const { brief, update } = useBrief()

  const submit = (e) => {
    e.preventDefault()
    navigate('/brief')
  }

  return (
    <>
      <Mesh />
      <Nav variant="app" />

      <div className="sheet wide">
        <div className="formcard">
          <h2>Build your brief</h2>

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="niche">Niche</label>
              <input id="niche" value={brief.niche} onChange={(e) => update({ niche: e.target.value })} autoComplete="off" />
              <p className="hint">Be specific where you can. &quot;Skin barrier repair&quot; benchmarks far better than &quot;beauty&quot;.</p>
            </div>

            <div className="field">
              <label>Platform</label>
              <ChipSet name="platform" options={PLATFORMS} value={brief.platform} onChange={(v) => update({ platform: v })} />
            </div>

            <div className="field">
              <label htmlFor="audience">Target audience</label>
              <input id="audience" value={brief.audience} onChange={(e) => update({ audience: e.target.value })} autoComplete="off" />
            </div>

            <div className="field">
              <label>
                Objective{' '}
                <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-2)' }}>
                  (select all that apply)
                </span>
              </label>
              <ChipSet multi name="objective" options={OBJECTIVES} value={brief.objectives} onChange={(v) => update({ objectives: v })} />
              <p className="hint">
                Shares reward a question at the close; retention rewards an unresolved loop in the middle.{' '}
                <b>Select more than one and Motif builds for the overlap.</b> Where objectives conflict, the first
                takes precedence.
              </p>
            </div>

            <div className="field">
              <label htmlFor="notes">
                Constraints <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                id="notes"
                value={brief.constraints}
                onChange={(e) => update({ constraints: e.target.value })}
                placeholder="Brand guidelines, the product in market, approaches you have already tested without result…"
              />
            </div>

            <h3>Creative direction</h3>
            <p className="lede">
              Motif supplies the structure. <b>You supply the creative intent.</b> The more specific this is, the
              less generic the brief returns. Only the vision field below is required.
            </p>

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
              <p className="alt">Returns in roughly 20 seconds.</p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
