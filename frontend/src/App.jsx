import { Routes, Route, Navigate } from 'react-router-dom'
import { BriefProvider } from './store.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
import SignInPage from './pages/SignIn.jsx'
import Protected from './components/Protected.jsx'
import Demo from './pages/Demo.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inputs from './pages/Inputs.jsx'
import Market from './pages/Market.jsx'
import Brief from './pages/Brief.jsx'
import SavedBrief from './pages/SavedBrief.jsx'

export default function App() {
  return (
    <BriefProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/demo" element={<Demo />} />

        {/* everything past the fold needs a real account */}
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/inputs" element={<Protected><Inputs /></Protected>} />
        <Route path="/market" element={<Protected><Market /></Protected>} />
        <Route path="/brief" element={<Protected><Brief /></Protected>} />
        <Route path="/briefs/:id" element={<Protected><SavedBrief /></Protected>} />

        {/* Without this, an unmatched path renders nothing at all - a blank
            white page with no nav and no way back. /choose and /vision were
            real URLs until they were folded into /dashboard and /inputs, so
            a bookmark or a shared link still points at them. Redirect rather
            than a 404 page: every one of these is a moved page or a typo, not
            a destination worth designing. replace so it doesn't trap the
            back button. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BriefProvider>
  )
}
