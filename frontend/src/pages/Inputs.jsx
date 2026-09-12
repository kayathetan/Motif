import { useNavigate } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import ChipSet from '../components/ChipSet.jsx'
import { useBrief } from '../store.jsx'

const PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts']
const OBJECTIVES = ['Shares', 'Reach', 'Retention', 'Conversions']

export default function Inputs() {
  const navigate = useNavigate()
  const { brief, update } = useBrief()

  const submit = (e) => {
    e.preventDefault()
    navigate('/choose')
  }

  return (
    <>
      <Mesh />
      <Nav variant="app" links={[{ label: 'Product', href: '/#product' }, { label: 'For teams', href: '/#teams' }]} />

      <div className="sheet wide">
        <div className="formcard">
          <h2>Campaign inputs</h2>
          <p className="lede">
            Four answers. These select which slice of the pattern library your campaign is measured against. The
            structure that works for <b>skincare shares</b> is not the structure that works for <b>finance retention</b>.
          </p>

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
                This drives the structure more than any other input. Shares reward a question at the close; retention
                rewards an unresolved loop in the middle. <b>Select more than one and Motif builds for the overlap.</b>{' '}
                Where objectives conflict, the first takes precedence.
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

            <div className="actions">
              <button className="btn-primary" type="submit">Continue →</button>
              <p className="alt">Editable later from any result page</p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
