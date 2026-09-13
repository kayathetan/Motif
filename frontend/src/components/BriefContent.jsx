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

      <div className="sec" style={{ marginTop: 40 }}>
        <h2>Script outline</h2>

        <div className="card" style={{ padding: '24px 26px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
            <div>
              <p className="tl">Format</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{data.content_format}</p>
            </div>
            <div>
              <p className="tl">Pacing</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{data.pacing}</p>
            </div>
            <div>
              <p className="tl">Visual style</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{data.visual_style}</p>
            </div>
            <div>
              <p className="tl">Audio direction</p>
              <p style={{ marginTop: 6, fontSize: 14.5 }}>{data.audio_direction}</p>
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
                <div className="sr"><p className="sk">Format</p><p className="sv">{beat.shot_style}</p></div>
                <div className="sr"><p className="sk">Shot</p><p className="sv">{beat.camera}</p></div>
                <div className="sr"><p className="sk">Light</p><p className="sv">{beat.lighting}</p></div>
                <div className="sr">
                  <p className="sk">Text</p>
                  <p className="sv">
                    {hasCaption ? `"${beat.on_screen_caption}" · ${beat.on_screen_text_style}` : beat.on_screen_text_style}
                  </p>
                </div>
                <div className="sr"><p className="sk">Audio</p><p className="sv">{beat.audio}</p></div>
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

      {intelligence?.status === 'ready' && (
        <div className="sec">
          <h2>Market context</h2>
          <div className="statrow">
            <div className="card stat">
              <p className="sl">Dominant format</p>
              <p className="sv" style={{ fontSize: 22 }}>{intelligence.data.dominant_format}</p>
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
                  {intelligence.data.top_cta_types[0].cta.replaceAll('_', ' ')}
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
