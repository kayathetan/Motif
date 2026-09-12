import { Routes, Route } from 'react-router-dom'
import { BriefProvider } from './store.jsx'

import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'
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
        <Route path="/inputs" element={<Inputs />} />
        <Route path="/choose" element={<Choose />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/market" element={<Market />} />
        <Route path="/brief" element={<Brief />} />
        <Route path="/analyse" element={<Analyse />} />
      </Routes>
    </BriefProvider>
  )
}
