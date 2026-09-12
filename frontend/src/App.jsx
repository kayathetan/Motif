import { Routes, Route } from 'react-router-dom'
import { BriefProvider } from './store.jsx'

import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
import SignInPage from './pages/SignIn.jsx'
import Protected from './components/Protected.jsx'
import Inputs from './pages/Inputs.jsx'
import Choose from './pages/Choose.jsx'
import Vision from './pages/Vision.jsx'
import Upload from './pages/Upload.jsx'
import Market from './pages/Market.jsx'
import Brief from './pages/Brief.jsx'
import Analyse from './pages/Analyse.jsx'

export default function App() {
  return (
    <BriefProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignInPage />} />

        {/* everything past the fold needs a real account */}
        <Route path="/inputs" element={<Protected><Inputs /></Protected>} />
        <Route path="/choose" element={<Protected><Choose /></Protected>} />
        <Route path="/vision" element={<Protected><Vision /></Protected>} />
        <Route path="/upload" element={<Protected><Upload /></Protected>} />
        <Route path="/market" element={<Protected><Market /></Protected>} />
        <Route path="/brief" element={<Protected><Brief /></Protected>} />
        <Route path="/analyse" element={<Protected><Analyse /></Protected>} />
      </Routes>
    </BriefProvider>
  )
}
