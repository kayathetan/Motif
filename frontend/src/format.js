/**
 * Small display-formatting helpers shared across pages that render raw
 * pipeline data (niche/content_type/cta labels straight from Postgres,
 * e.g. "talking head + b-roll cutaways") next to LLM-generated prose,
 * which is already sentence-cased. Left alone, the raw labels read as a
 * capitalization bug sitting right next to properly-cased text.
 */

/** Capitalizes only the first letter - "talking head" -> "Talking head",
 * not Title Case, since these are often short phrases ("visit link") or
 * ones with symbols ("b-roll") that Title Case would mangle. */
export function capitalize(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** content_type/cta_type values are stored snake_case - "before_after_transformation". */
export function formatLabel(text) {
  return capitalize((text || '').replaceAll('_', ' '))
}
