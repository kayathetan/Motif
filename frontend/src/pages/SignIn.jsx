import { SignIn } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'

export default function SignInPage() {
  return (
    <>
      <Mesh />
      <Nav variant="back" links={[{ label: 'Market', to: '/market' }]} />
      <div className="sheet">
        <div className="authcard">
          <SignIn signUpUrl="/signup" forceRedirectUrl="/inputs" />
        </div>
      </div>
    </>
  )
}
