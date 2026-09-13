import { SignUp } from '@clerk/react'
import Mesh from '../components/Mesh.jsx'
import Nav from '../components/Nav.jsx'

export default function SignupPage() {
  return (
    <>
      <Mesh />
      <Nav variant="back" />
      <div className="sheet">
        <div className="authcard">
          <SignUp signInUrl="/signin" forceRedirectUrl="/onboarding" />
        </div>
      </div>
    </>
  )
}
