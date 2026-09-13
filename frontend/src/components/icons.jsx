/**
 * Small inline icons - currentColor throughout so they pick up whatever
 * color/hover treatment the surrounding button already defines, rather
 * than needing their own color logic.
 */

export function BinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4h11M6 4V2.75c0-.41.34-.75.75-.75h2.5c.41 0 .75.34.75.75V4m-6.5 0 .55 8.32c.05.87.77 1.55 1.64 1.55h4.12c.87 0 1.59-.68 1.64-1.55L12.5 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
