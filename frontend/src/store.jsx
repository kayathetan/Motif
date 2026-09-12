import { createContext, useContext, useState } from 'react'

/**
 * Holds the campaign inputs as the user moves through the flow, so the brief
 * and audit pages can show what was actually entered rather than hardcoded
 * placeholders. When the FastAPI backend is wired in, this is the payload to
 * POST to /api/brief.
 */
const BriefContext = createContext(null)

const initial = {
  account: { name: 'Demo User', company: 'Acme Skincare', role: 'Social media manager' },
  niche: 'skincare',
  platform: 'Instagram Reels',
  audience: 'women 18–24',
  objectives: ['Shares', 'Retention'],
  constraints: '',
  vision: '',
  topic: '',
  tone: [],
  resources: [],
  duration: '0:45'
}

export function BriefProvider({ children }) {
  const [brief, setBrief] = useState(initial)
  const update = (patch) => setBrief((b) => ({ ...b, ...patch }))
  return (
    <BriefContext.Provider value={{ brief, update }}>
      {children}
    </BriefContext.Provider>
  )
}

export function useBrief() {
  const ctx = useContext(BriefContext)
  if (!ctx) throw new Error('useBrief must be used inside BriefProvider')
  return ctx
}
