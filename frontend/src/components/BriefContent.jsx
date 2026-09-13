/**
 * The actual generated-brief body: script outline, hook options, CTA and
 * hashtags. Shared between Brief.jsx (a freshly generated one) and
 * SavedBrief.jsx (one fetched back from history) - the two differ only in
 * where `data` (a BriefGenerationResponse) comes from, not in how it's
 * shown.
 */
export default function BriefContent({ data, niche }) {
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

        {data.script_outline.map((beat, i) => (
          <div
            className="card"
            key={i}
            style={{ padding: '18px 24px', display: 'flex', gap: 22, alignItems: 'baseline', marginBottom: 10 }}
          >
            <p className="mono" style={{ fontSize: 14, color: 'var(--purple-deep)', fontWeight: 560, flex: '0 0 110px' }}>
              {beat.timestamp}
            </p>
            <p style={{ fontSize: 14.5 }}>{beat.action}</p>
          </div>
        ))}
      </div>

      <div className="sec">
        <h2>Hook options</h2>
        <div className="hooks">
          {data.hook_options.map((line, i) => (
            <div className="card hook" key={i}>
              <p className="hn">Option {String(i + 1).padStart(2, '0')}</p>
              <p className="hl">{line}</p>
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
    </>
  )
}
