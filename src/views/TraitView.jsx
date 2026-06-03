import { useState } from 'react'
import { byKey, SKILL_CATS } from '../config/metrics'
import { saveBank, saveBankMulti } from '../services/db'

export default function TraitView({
  roster, myEvals, week, user, coachKey, traitKey, setTraitKey, locked,
}) {
  const m = byKey[traitKey]
  const [posFilter, setPosFilter] = useState('All Positions')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sortBy, setSortBy] = useState('name')

  // For tally group, value is { kills, errors, inPlay }; otherwise a scalar.
  function getVal(rec) {
    if (m.group === 'tally') {
      return {
        kills:  rec?.skill?.hitKills  ?? null,
        errors: rec?.skill?.hitErrors ?? null,
        inPlay: rec?.skill?.hitInPlay ?? null,
      }
    }
    if (!rec || !rec[m.bank]) return null
    const v = rec[m.bank][m.key]
    return v === undefined ? null : v
  }

  function save(player, value) {
    if (locked) return
    if (m.group === 'tally') {
      saveBankMulti({
        player, week, user, coachKey, bank: 'skill',
        kvs: {
          hitKills:  value.kills  ?? null,
          hitErrors: value.errors ?? null,
          hitInPlay: value.inPlay ?? null,
        },
      })
    } else {
      saveBank({ player, week, user, coachKey, bank: m.bank, key: m.key, value })
    }
  }

  let filtered = roster
  if (posFilter !== 'All Positions') filtered = filtered.filter((p) => p.position === posFilter)
  if (gradeFilter !== 'All Grades')  filtered = filtered.filter((p) => p.grade === gradeFilter)
  if (sortBy === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  const positions = [...new Set(roster.map((p) => p.position))].sort()
  const grades    = [...new Set(roster.map((p) => p.grade))].sort()

  return (
    <div>
      <div className="perf-area-card">
        <div className="paca-label">
          <span className="icon">📌</span> Select Performance Area
        </div>
        <div className="perf-grid">
          {SKILL_CATS.map((cat) => (
            <div key={cat.title} className="perf-category">
              <h4>{cat.title}</h4>
              <div className="perf-items">
                {cat.keys.map((key) => {
                  const skill = byKey[key]
                  const isSelected = traitKey === key
                  return (
                    <button
                      key={key}
                      className={`perf-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setTraitKey(key)}
                    >
                      <div className="pbtn-label">{skill.label}</div>
                      {skill.desc && <div className="pbtn-desc">{skill.desc}</div>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Position:</label>
          <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
            <option>All Positions</option>
            {positions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Grade:</label>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option>All Grades</option>
            {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>
        <button className="sort-btn" onClick={() => setSortBy(sortBy === 'name' ? 'reverse' : 'name')}>
          ↕️ Sort by Name
        </button>
        <div className="showing-count">
          Showing {filtered.length} of {roster.length} athletes
        </div>
      </div>

      <div className={`sec ${m.group === 'seconds' || m.group === 'tally' || m.group === 'pct' ? '' : 'gold'}`}>
        <div className="bar">
          <h3>Rate Athletes: {m.label}</h3>
          <p>{m.desc}</p>
        </div>
      </div>

      {filtered.map((p) => {
        const rec = myEvals[`${p.id}__w${week}`]
        const v = getVal(rec)
        return (
          <div className="athlete-row" key={p.id}>
            <div className="athlete-info">
              <div className="athlete-name">{p.name}</div>
              <div className="athlete-meta">{p.position} · {p.grade}</div>
            </div>
            <div className="athlete-control">
              <RowControl m={m} value={v} onChange={(val) => save(p, val)} />
            </div>
            <ScoreIndicator m={m} value={v} />
          </div>
        )
      })}
    </div>
  )
}

function ScoreIndicator({ m, value }) {
  if (m.group === 'tally') {
    const k = Number(value?.kills)  || 0
    const e = Number(value?.errors) || 0
    const i = Number(value?.inPlay) || 0
    const total = k + e + i
    if (total === 0 && value?.kills == null) return null
    const eff = total > 0 ? ((k - e) / total).toFixed(3) : '–'
    return <div className="score-indicator">{k}K {e}E {i}IP → {eff}</div>
  }
  if (value == null || value === '') return null
  if (m.group === 'inches')  return <div className="score-indicator">{value}"</div>
  if (m.group === 'seconds') return <div className="score-indicator">{value}s</div>
  if (m.group === 'pct')     return <div className="score-indicator">{value}%</div>
  return <div className="score-indicator">{value}</div>
}

function RowControl({ m, value, onChange }) {
  if (m.group === 'rating03') {
    return (
      <div className="rating-buttons">
        {[0, 1, 2, 3].map((n) => (
          <button key={n} className={`rating-btn ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
        <button className={`rating-btn ${value == null ? 'active' : ''}`} onClick={() => onChange(null)}>
          N/A
        </button>
      </div>
    )
  }

  if (m.group === 'inches' || m.group === 'seconds') {
    return (
      <div className="num-input-wrap">
        <input
          className="tnum"
          type="number"
          inputMode="decimal"
          step={m.step}
          min={m.min}
          max={m.max}
          placeholder={m.ph}
          defaultValue={value ?? ''}
          onBlur={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
        <span className="unit">{m.group === 'inches' ? 'in' : 'sec'}</span>
      </div>
    )
  }

  if (m.group === 'tally') {
    return <TallyControl value={value} onChange={onChange} />
  }

  // pct — percentage slider
  return (
    <div className="pslider">
      <input
        type="range" min="0" max="100" step="5"
        defaultValue={value ?? 50}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="rd">{value == null ? '–' : `${value}%`}</span>
    </div>
  )
}

function TallyControl({ value, onChange }) {
  const [kills,  setKills]  = useState(() => value?.kills  ?? '')
  const [errors, setErrors] = useState(() => value?.errors ?? '')
  const [inPlay, setInPlay] = useState(() => value?.inPlay ?? '')

  function commit(k, e, ip) {
    onChange({
      kills:  k  === '' ? null : Number(k),
      errors: e  === '' ? null : Number(e),
      inPlay: ip === '' ? null : Number(ip),
    })
  }

  const k = Number(kills)  || 0
  const e = Number(errors) || 0
  const i = Number(inPlay) || 0
  const total = k + e + i
  const eff = total > 0 ? ((k - e) / total).toFixed(3) : '–'

  return (
    <div className="tally-control">
      <div className="tally-fields">
        <div className="tally-field">
          <span className="tally-lbl">K</span>
          <input
            type="number" inputMode="numeric" min="0" step="1"
            value={kills}
            onChange={(ev) => setKills(ev.target.value)}
            onBlur={() => commit(kills, errors, inPlay)}
          />
        </div>
        <div className="tally-field">
          <span className="tally-lbl">E</span>
          <input
            type="number" inputMode="numeric" min="0" step="1"
            value={errors}
            onChange={(ev) => setErrors(ev.target.value)}
            onBlur={() => commit(kills, errors, inPlay)}
          />
        </div>
        <div className="tally-field">
          <span className="tally-lbl">IP</span>
          <input
            type="number" inputMode="numeric" min="0" step="1"
            value={inPlay}
            onChange={(ev) => setInPlay(ev.target.value)}
            onBlur={() => commit(kills, errors, inPlay)}
          />
        </div>
      </div>
      <div className="tally-eff">Eff: {eff}</div>
    </div>
  )
}
