/**
 * Pill-style selection control. `multi` renders checkboxes (select all that apply),
 * otherwise radios. Value is held by the parent.
 */
export default function ChipSet({ name, options, value, onChange, multi = false }) {
  const selected = multi ? value : [value]

  const toggle = (opt) => {
    if (!multi) return onChange(opt)
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <div className="chipset">
      {options.map((opt, i) => {
        const id = `${name}-${i}`
        return (
          <span key={opt} style={{ display: 'contents' }}>
            <input
              type={multi ? 'checkbox' : 'radio'}
              id={id}
              name={name}
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <label htmlFor={id}>{opt}</label>
          </span>
        )
      })}
    </div>
  )
}
