import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { enableDemo } from '../demo.js'

/** /demo — turn on demo mode and drop straight into the product. */
export default function Demo() {
  const navigate = useNavigate()

  useEffect(() => {
    enableDemo()
    navigate('/dashboard', { replace: true })
  }, [navigate])

  return <div className="authwait">Opening the demo…</div>
}
