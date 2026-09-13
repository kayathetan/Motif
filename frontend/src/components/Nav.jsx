import { Link } from 'react-router-dom'
import { Show, UserButton, useUser } from '@clerk/react'
import { isDemo, exitDemo } from '../demo.js'

/**
 * Top bar. `variant` decides what sits on the right:
 *   marketing  logged-out buttons
 *   back       a single Back link (signup)
 *   app        the signed-in user chip, plus an optional action
 */
export default function Nav({ variant = 'marketing', links = [], action = null }) {
  const { user } = useUser()
  const demo = isDemo()
  const label = user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Account'

  const leaveDemo = () => { exitDemo(); window.location.href = '/' }

  return (
    <div className="nav">
      <Link className="brand" to="/"><img className="mk" src="/logo.png" alt="" width="29" height="29" />Motif</Link>

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
            <Show when="signed-out">
              <Link className="btn-ghost" to="/signin">Log in</Link>
              <Link className="btn-dark" to="/signup">Get started</Link>
            </Show>
            <Show when="signed-in">
              <Link className="btn-ghost" to="/dashboard">Dashboard</Link>
              <UserButton afterSignOutUrl="/" />
            </Show>
          </>
        )}
        {variant === 'back' && <Link className="btn-ghost" to="/">Back</Link>}
        {variant === 'app' && (
          <>
            {action && <Link className="btn-dark" to={action.to}>{action.label}</Link>}
            {demo ? (
              <>
                <span className="demopill">Demo</span>
                <button className="btn-ghost" onClick={leaveDemo}>Exit</button>
              </>
            ) : (
              <span className="user"><UserButton afterSignOutUrl="/" />{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
