import { createContext, useContext, useState } from 'react'

/**
 * Holds the campaign inputs as the user moves through the flow, so the brief
 * page can show what was actually entered rather than hardcoded placeholders.
 * See api.js's toBriefRequest() for how this shape maps to the POST
 * /api/brief/generate payload.
 */
const BriefContext = createContext(null)

// The default niche/platform must name a combination the pattern library
// actually holds, or /market opens on "No patterns stored yet" - which is
// what a /demo visitor sees first. Today the library is entirely
// beauty + youtube_shorts (44 patterns).
//
// 'beauty' is the stored niche name, not a nicer-reading synonym, on
// purpose: taxonomy.canonicalize_niche resolves free text by label-
// embedding similarity against a 0.82 threshold, and 'skincare' scores
// only 0.477 against the stored 'beauty' row - so it 404s. Measured
// rather than assumed, and the threshold is NOT the thing to relax:
// 'fitness' scores 0.401 against the same row, so any threshold loose
// enough to admit skincare would also map fitness to beauty. Short
// category labels simply don't separate in embedding space.
const initial = {
  // company is still user-entered; name and email come from Clerk via useUser()
  account: { company: 'Acme Skincare', role: 'Social media manager' },
  niche: 'beauty',
  platform: 'YouTube Shorts',
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
