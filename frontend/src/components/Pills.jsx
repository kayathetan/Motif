import { Link } from 'react-router-dom'

/** The campaign-context chips shown above a result, and on the fork page. */
export default function Pills({ brief, extra = null, left = false, editable = false }) {
  return (
    <div className="pills" style={left ? { justifyContent: 'flex-start', marginTop: 0 } : undefined}>
      <span className="pill">niche <b>{brief.niche}</b></span>
      <span className="pill">platform <b>{brief.platform}</b></span>
      <span className="pill">audience <b>{brief.audience}</b></span>
      <span className="pill">objective <b>{brief.objectives.join(', ').toLowerCase()}</b></span>
      {extra && <span className="pill">{extra}</span>}
      {editable && <Link className="pill" to="/inputs" style={{ color: 'var(--purple-deep)' }}>edit</Link>}
    </div>
  )
}
