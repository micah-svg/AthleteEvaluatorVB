import { useEffect, useState } from 'react'
import { SKILLS, SKILL_CATS, byKey, numFmt } from '../config/metrics'
import { bankVal } from '../lib/aggregate'
import { saveSkills } from '../services/db'

export default function AthleteView({ roster, myEvals, week, user, coachKey, playerId, locked }) {
  const [entry, setEntry] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const rec = myEvals[`${playerId}__w${week}`]
    const e = {}
    SKILLS.forEach((m) => { e[m.key] = bankVal(rec, m) })
    setEntry(e)
  }, [playerId, week, myEvals])

  const player = roster.find((p) => p.id === playerId)
  const set = (k, v) => !locked && setEntry((s) => ({ ...s, [k]: v }))

  async function save() {
    if (!player || locked) return
    await saveSkills({ player, week, user, coachKey, skill: entry })
    setSaved(true); setTimeout(() => setSaved(false), 1400)
  }

  if (!player) return <p className="pending">Pick an athlete above.</p>

  return (
    <div>
      {SKILL_CATS.map((c) => (
        <div key={c.title}>
          <div className={`sec ${c.accent === 'gold' ? 'gold' : ''}`}>
            <div className="bar"><h3>{c.title}</h3></div>
          </div>
          {c.keys.map((k) => (
            <MetricCard key={k} m={byKey[k]} value={entry[k]} onChange={(v) => set(k, v)} />
          ))}
        </div>
      ))}
      <div className="savebar">
        <div className="savebar-inner">
          <div className="target">
            <div className="tname">{player.name}</div>
            <div className="tstat">{locked ? `Week ${week} submitted — locked` : `Week ${week} · skills`}</div>
          </div>
          <button className={`save-btn ${saved ? 'saved' : ''}`} disabled={locked} onClick={save}>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ m, value, onChange }) {
  return (
    <div className="metric">
      <div className="mtop">
        <div>
          <div className="mname">{m.label}</div>
          <div className="mdesc">{m.desc}</div>
        </div>
        <span className={`badge ${m.group === 'num' ? 'gold' : ''} ${value == null ? 'empty' : ''}`}>
          {value == null ? '–' : m.group === 'pct' ? `${value}%` : m.group === 'num' ? numFmt(m, value) : value}
        </span>
      </div>
      {m.group === 'scale' && (
        <div className="scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={`scale-btn ${value === n ? 'sel' : ''}`} onClick={() => onChange(n)}>{n}</button>
          ))}
        </div>
      )}
      {m.group === 'num' && (
        <div className="num-row">
          <input type="number" inputMode="decimal" step={m.step} min={m.min} max={m.max}
            placeholder={m.ph} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
          <div className="presets">
            {m.presets.map((v) => (
              <button key={v} className="preset" onClick={() => onChange(v)}>{numFmt(m, v)}</button>
            ))}
          </div>
        </div>
      )}
      {m.group === 'pct' && (
        <input type="range" min="0" max="100" step="5" value={value ?? 50}
          onChange={(e) => onChange(Number(e.target.value))} />
      )}
    </div>
  )
}
