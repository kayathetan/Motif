import { Routes, Route } from 'react-router-dom'
import { BriefProvider } from './store.jsx'

import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
import SignInPage from './pages/SignIn.jsx'
import Protected from './components/Protected.jsx'
import Demo from './pages/Demo.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inputs from './pages/Inputs.jsx'
import Choose from './pages/Choose.jsx'
import Vision from './pages/Vision.jsx'
import Market from './pages/Market.jsx'
import Brief from './pages/Brief.jsx'
import SavedBrief from './pages/SavedBrief.jsx'

export default function App() {
  return (
    <BriefProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/demo" element={<Demo />} />

        {/* everything past the fold needs a real account */}
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/inputs" element={<Protected><Inputs /></Protected>} />
        <Route path="/choose" element={<Protected><Choose /></Protected>} />
        <Route path="/vision" element={<Protected><Vision /></Protected>} />
        <Route path="/market" element={<Protected><Market /></Protected>} />
        <Route path="/brief" element={<Protected><Brief /></Protected>} />
        <Route path="/briefs/:id" element={<Protected><SavedBrief /></Protected>} />
      </Routes>
    </BriefProvider>
  )
}
