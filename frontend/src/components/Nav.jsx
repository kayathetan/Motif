import { Link } from 'react-router-dom'

/**
 * Top bar. `variant` decides what sits on the right:
 *   marketing  logged-out buttons
 *   back       a single Back link (signup)
 *   app        the signed-in user chip, plus an optional action
 */
export default function Nav({ variant = 'marketing', links = [], action = null }) {
  return (
    <div className="nav">
      <Link className="brand" to="/"><span className="mk" />Motif</Link>

      <div className="nav-links">
        {links.map((l) =>
          l.to
            ? <Link key={l.label} to={l.to} className={l.on ? 'on' : undefined}>{l.label}</Link>
            : <a key={l.label} href={l.href || '#'} className={l.on ? 'on' : undefined}>{l.label}</a>
        )}
      </div>

      <div className="nav-right">
        {variant === 'marketing' && (
          <>
            <Link className="btn-ghost" to="/signup">Log in</Link>
            <Link className="btn-dark" to="/signup">Book a demo</Link>
          </>
        )}
        {variant === 'back' && <Link className="btn-ghost" to="/">Back</Link>}
        {variant === 'app' && (
          <>
            <span className="user"><span className="av">DU</span>demo user <span className="tick">✓</span></span>
            {action && <Link className="btn-dark" to={action.to}>{action.label}</Link>}
          </>
        )}
      </div>
    </div>
  )
}
