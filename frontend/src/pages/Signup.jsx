import { Link, useNavigate } from 'react-router-dom'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'
import { useBrief } from '../store.jsx'

export default function Signup() {
  const navigate = useNavigate()
  const { brief, update } = useBrief()
  const { account } = brief

  const setAccount = (patch) => update({ account: { ...account, ...patch } })

  const submit = (e) => {
    e.preventDefault()
    navigate('/inputs')
  }

  return (
    <>
      <Mesh />
      <Nav variant="back" links={[{ label: 'Product', href: '/#product' }, { label: 'For teams', href: '/#teams' }]} />

      <div className="sheet">
        <div className="formcard">
          <p className="demo-note">Demo workspace · nothing is stored</p>
          <h2>Create a workspace.</h2>
          <p className="lede">
            This is a prototype with no backend, so the form does not submit anywhere. Enter placeholder details and
            continue. <b>Do not enter a real password.</b>
          </p>

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={account.name} onChange={(e) => setAccount({ name: e.target.value })} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="company">Company</label>
              <input id="company" value={account.company} onChange={(e) => setAccount({ company: e.target.value })} autoComplete="off" />
              <p className="hint">
                Your workspace is scoped to the company, so briefs and audits stay with the account rather than the
                individual.
              </p>
            </div>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" placeholder="demo@example.com" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <input id="role" value={account.role} onChange={(e) => setAccount({ role: e.target.value })} autoComplete="off" />
            </div>

            <div className="actions">
              <button className="btn-pink" type="submit">Continue →</button>
              <p className="alt">Existing workspace? <Link to="/inputs">Skip to inputs</Link></p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
