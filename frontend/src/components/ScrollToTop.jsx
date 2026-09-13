import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router v6 without a data router (createBrowserRouter) does no
 * scroll management at all - the browser just leaves window scroll where
 * it was. That's invisible for most in-app navigation (pages start near
 * the top anyway), but concretely broke "See full market breakdown" on a
 * brief: that button lives at the very bottom of a long brief, so
 * clicking it landed on /market scrolled to roughly the same pixel
 * offset - the bottom of a shorter page, footer first, nothing else
 * visible.
 *
 * Rendered once near the root, inside <BrowserRouter> (so useLocation
 * works) - resets scroll on every route change. pathname only, not the
 * full location: a `state`-only navigation (like the fromBrief flag on
 * that same /market link) shouldn't itself trigger a jump if the path
 * didn't change.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
