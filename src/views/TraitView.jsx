import { byKey, SKILL_CATS, SKILLS } from '../config/metrics'
import { bankVal } from '../lib/aggregate'
import { saveBank } from '../services/db'

export default function TraitView({ roster, myEvals, week, user, coachKey, traitKey, setTraitKey, locked }) {
  const m = byKey[traitKey]

  function save(player, value) {
    if (locked) return
    saveBank({ player, week, user, coachKey, bank: m.bank, key: m.key, value })
  }

  return (
    <div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>Skill to score</label>
        <select value={traitKey} onChange={(e) => setTraitKey(e.target.value)}>
          {SKILL_CATS.map((c) => (
            <optgroup key={c.title} label={c.title}>
              {c.keys.map((k) => <option key={k} value={k}>{byKey[k].label}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className={`sec ${m.group === 'scale' ? '' : 'gold'}`}>
        <div className="bar"><h3>{m.label}</h3><p>{m.desc}. Week {week}. {locked ? 'Locked.' : 'Saves on each entry.'}</p></div>
      </div>
      {roster.map((p) => {
        const v = bankVal(myEvals[`${p.id}__w${week}`], m)
        return (
          <div className="trow" key={p.id}>
            <div className="pinfo">
              <div className="pn">{p.name}</div>
              <div className="pmeta">{p.grade} · {p.position}</div>
            </div>
            <div className="pctl">
              <RowControl m={m} value={v} onChange={(val) => save(p, val)} />
              <span className={`tick ${v != null && v !== '' ? 'on' : ''}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RowControl({ m, value, onChange }) {
  if (m.group === 'scale') {
    return (
      <div className="sc5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={value === n ? 'sel' : ''} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
    )
  }
  if (m.group === 'num' && m.buttons) {
    return (
      <div className="srb">
        {m.buttons.map((n) => (
          <button key={n} className={value === n ? 'sel' : ''} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
    )
  }
  if (m.group === 'num') {
    return (
      <input className="tnum" type="number" inputMode="decimal" step={m.step}
        placeholder={m.ph} defaultValue={value ?? ''}
        onBlur={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
    )
  }
  return (
    <div className="pslider">
      <input type="range" min="0" max="100" step="5" defaultValue={value ?? 50}
        onChange={(e) => onChange(Number(e.target.value))} />
      <span className="rd">{value == null ? '–' : `${value}%`}</span>
    </div>
  )
}
