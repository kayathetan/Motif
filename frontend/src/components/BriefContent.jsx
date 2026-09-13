import { useEffect, useRef } from 'react'
import { capitalize, formatLabel } from '../format.js'

/**
 * The reference-video pills in one scrollable row rather than a grid -
 * with up to 6 of them, a grid either got cramped or left the row
 * looking unbalanced. Auto-scrolls back and forth on its own when there
 * are more than fit at once (3-ish at typical widths), pausing on
 * hover/touch so someone can still stop and read one or click through -
 * a plain CSS animation can't pause like that or know how far it
 * actually needs to travel, hence stepping scrollLeft in a rAF loop
 * instead. Skipped entirely under prefers-reduced-motion.
 */
function ReferenceVideos({ videos }) {
  const scrollerRef = useRef(null)
  const pausedRef = useRef(false)
  const directionRef = useRef(1)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || videos.length <= 3) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame
    const step = () => {
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) {
        frame = requestAnimationFrame(step)
        return
      }
      if (!pausedRef.current) {
        let next = el.scrollLeft + directionRef.current * 0.6
        if (next >= max) {
          next = max
          directionRef.current = -1
        } else if (next <= 0) {
          next = 0
          directionRef.current = 1
        }
        el.scrollLeft = next
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [videos.length])

  return (
    <div
      className="refs"
      ref={scrollerRef}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onTouchStart={() => { pausedRef.current = true }}
    >
      {videos.map((v) => {
        // Real videos, real URLs - see ReferenceVideo's docstring. The
        // thumbnail is YouTube's own predictable image URL for the id,
        // not anything stored or generated - no extra fetch needed.
        const videoId = v.video_url.split('/shorts/')[1]?.split(/[?&]/)[0]
        return (
          <a key={v.video_url} href={v.video_url} target="_blank" rel="noreferrer" className="card ref">
            {videoId && (
              <img
                className="refthumb"
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
              />
            )}
            <div>
              <p className="rt">{v.title}</p>
              <p className="rm">
                {formatLabel(v.content_type)} · {v.views.toLocaleString()} views ↗
              </p>
            </div>
          </a>
        )
      })}
    </div>
  )
}

/**
 * The actual generated-brief body: script outline, hook options, CTA,
 * hashtags, and a real-data market snapshot. Shared between Brief.jsx (a
 * freshly generated one) and SavedBrief.jsx (one fetched back from
 * history) - the two differ only in where `data` comes from, not in how
 * it's shown.
 *
 * Args:
 *   data: BriefGenerationResponse.
 *   niche: The niche this brief was generated for (for the "not in the
 *     pattern library" notice above).
 *   intelligence: Optional { status, data } for the market snapshot at
 *     the bottom - status is 'ready' | anything else. Omitted entirely
 *     (not an error state) when not 'ready': this is supplementary
 *     context on top of the brief, not something worth its own error UI
 *     if the niche has no stored patterns or the fetch failed.
 *   onViewMarket: Called when "See full market breakdown" is clicked.
 */
export default function BriefContent({ data, niche, intelligence, onViewMarket }) {
  return (
    <>
      {!data.niche_recognized && (
        <div className="sec" style={{ marginTop: 40 }}>
          <div className="card" style={{ padding: '18px 24px', background: 'var(--warn-bg)' }}>
            <p style={{ fontSize: 13.5, color: 'var(--warn)' }}>
              <b>&quot;{niche}&quot;</b> isn&apos;t in the pattern library yet - this brief draws on general
              evidence across niches rather than {niche}-specific data. It&apos;ll get more specific once
              real {niche} content has been measured.
            </p>
          </div>
        </div>
      )}

      {/* Deliberately the first thing after the ready state loads, not an
          appendix - this is the answer to "couldn't ChatGPT just write
          this": every number here is computed in code from the exact
          videos retrieved for this request, not asserted by the same
          model that wrote the script outline below. tier_label says how
          targeted the match actually was, honestly, including when it
          had to broaden past an exact niche/platform hit - see
          retrieval.TIER_LABELS. */}
      {data.evidence && (
        <div className="sec" style={{ marginTop: data.niche_recognized ? 40 : 24 }}>
          <div className="card evidence">
            <div className="ev-head">
              <p className="tl" style={{ color: 'var(--purple-deep)' }}>Grounded in real data</p>
              <p className="ev-tier">{data.evidence.tier_label}</p>
            </div>

            {data.evidence.pattern_count > 0 ? (
              <>
                <div className="ev-stats">
                  <div>
                    <p className="tl">Measured examples</p>
                    <p className="ev-v">{data.evidence.pattern_count}</p>
                  </div>
                  <div>
                    <p className="tl">Dominant format</p>
                    <p className="ev-v sm">
                      {capitalize(data.evidence.dominant_format)} <span>{data.evidence.dominant_format_percent}%</span>
                    </p>
                  </div>
                  <div>
                    <p className="tl">Avg hook delivery</p>
                    <p className="ev-v sm">{data.evidence.avg_hook_delivery_seconds}s</p>
                  </div>
                  <div>
                    <p className="tl">Top CTA</p>
                    <p className="ev-v sm">
                      {formatLabel(data.evidence.top_cta)} <span>{data.evidence.top_cta_percent}%</span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-2)' }}>
                No directly comparable videos were retrieved for this request - this brief draws on general
                reasoning rather than category-specific evidence.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="sec" style={{ marginTop: 40 }}>
        <h2>Script outline</h2>

        <div className="card" style={{ padding: '24px 26px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
            <div>
              <p className="tl">Format</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{capitalize(data.content_format)}</p>
            </div>
            <div>
              <p className="tl">Pacing</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{capitalize(data.pacing)}</p>
            </div>
            <div>
              <p className="tl">Visual style</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{capitalize(data.visual_style)}</p>
            </div>
            <div>
              <p className="tl">Audio direction</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{capitalize(data.audio_direction)}</p>
            </div>
          </div>
        </div>

        {data.script_outline.map((beat, i) => {
          const hasCaption = beat.on_screen_caption && beat.on_screen_caption.trim()
          return (
            <div className="card band" key={i}>
              <div>
                <p className="tm mono">{beat.timestamp}</p>
                <p className="dur">
                  {beat.duration_seconds} second{beat.duration_seconds === 1 ? '' : 's'}
                </p>
              </div>

              <div className="mid">
                <h3>{beat.heading}</h3>
                <p>{beat.action}</p>
              </div>

              <div className="spec">
                <div className="sr"><p className="sk">Format</p><p className="sv">{capitalize(beat.shot_style)}</p></div>
                <div className="sr"><p className="sk">Shot</p><p className="sv">{capitalize(beat.camera)}</p></div>
                <div className="sr"><p className="sk">Light</p><p className="sv">{capitalize(beat.lighting)}</p></div>
                <div className="sr">
                  <p className="sk">Text</p>
                  <p className="sv">
                    {hasCaption
                      ? `"${beat.on_screen_caption}" · ${beat.on_screen_text_style}`
                      : capitalize(beat.on_screen_text_style)}
                  </p>
                </div>
                <div className="sr"><p className="sk">Audio</p><p className="sv">{capitalize(beat.audio)}</p></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sec">
        <h2>Hook options</h2>
        <div className="hooks">
          {data.hook_options.map((opt, i) => (
            <div className="card hook" key={i}>
              <p className="hn">
                Option {String(i + 1).padStart(2, '0')}
                {opt.style && ` · ${opt.style}`}
              </p>
              <p className="hl">{opt.text}</p>
              {(opt.delivery_note || opt.why_it_works) && (
                <div className="hw">
                  {opt.delivery_note && <p><b>Delivery:</b> {opt.delivery_note}</p>}
                  {opt.why_it_works && (
                    <p style={{ marginTop: opt.delivery_note ? 8 : 0 }}>
                      <b>Why it works:</b> {opt.why_it_works}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <div className="duo">
          <div className="card tc">
            <p className="tl">Approved CTA line</p>
            <p className="ctaline">&quot;{data.cta}&quot;</p>
          </div>
          <div className="card tc">
            <p className="tl">Hashtags</p>
            <div className="tags">
              {data.hashtags.map((t) => (
                <span className="tag" key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {data.evidence?.reference_videos.length > 0 && (
        <div className="sec">
          <h2>Reference videos used as evidence</h2>
          <ReferenceVideos videos={data.evidence.reference_videos} />
        </div>
      )}

      {intelligence?.status === 'ready' && (
        <div className="sec">
          <h2>Market context</h2>
          <div className="statrow">
            <div className="card stat">
              <p className="sl">Dominant format</p>
              <p className="sv" style={{ fontSize: 22 }}>{capitalize(intelligence.data.dominant_format)}</p>
              <p className="sn">{intelligence.data.dominant_format_percent}% of top performers</p>
            </div>
            <div className="card stat">
              <p className="sl">Avg hook delivery</p>
              <p className="sv">{intelligence.data.avg_hook_delivery_seconds}<span className="su">sec</span></p>
            </div>
            <div className="card stat">
              <p className="sl">Hook should land under</p>
              <p className="sv">{intelligence.data.structural_benchmark.hook_under_seconds}<span className="su">sec</span></p>
            </div>
            {intelligence.data.top_cta_types[0] && (
              <div className="card stat">
                <p className="sl">Most-used CTA</p>
                <p className="sv" style={{ fontSize: 22 }}>
                  {formatLabel(intelligence.data.top_cta_types[0].cta)}
                </p>
                <p className="sn">{intelligence.data.top_cta_types[0].percent}% of top performers</p>
              </div>
            )}
          </div>
          <p style={{ marginTop: 18 }}>
            <button className="btn-dark" type="button" onClick={onViewMarket}>
              See full market breakdown →
            </button>
          </p>
        </div>
      )}
    </>
  )
}
