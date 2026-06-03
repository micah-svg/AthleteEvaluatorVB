import { useState } from 'react'
import { byKey, SKILL_CATS } from '../config/metrics'
import { bankVal } from '../lib/aggregate'
import { saveBank } from '../services/db'

export default function TraitView({
  roster, myEvals, week, user, coachKey, traitKey, setTraitKey, locked, submitInfo,
}) {
  const m = byKey[traitKey]
  const [posFilter, setPosFilter] = useState('All Positions')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [sortBy, setSortBy] = useState('name')

  function save(player, value) {
    if (locked) return
    saveBank({ player, week, user, coachKey, bank: m.bank, key: m.key, value })
  }

  const allSkills = SKILL_CATS.flatMap(c => c.keys.map(k => byKey[k]))

  let filtered = roster
  if (posFilter !== 'All Positions') filtered = filtered.filter(p => p.position === posFilter)
  if (gradeFilter !== 'All Grades') filtered = filtered.filter(p => p.grade === gradeFilter)

  if (sortBy === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  const scored = filtered.filter((p) => bankVal(myEvals[`${p.id}__w${week}`], m) != null).length
  const positions = [...new Set(roster.map(p => p.position))].sort()
  const grades = [...new Set(roster.map(p => p.grade))].sort()

  return (
    <div>
      <div className="perf-area-card">
        <div className="paca-label">
          <span className="icon">📌</span> Select Performance Area
        </div>
        <div className="perf-grid">
          {SKILL_CATS.map(cat => (
            <div key={cat.title} className="perf-category">
              <h4>{cat.title}</h4>
              <div className="perf-items">
                {cat.keys.map(key => {
                  const skill = byKey[key]
                  const isSelected = traitKey === key
                  return (
                    <button
                      key={key}
                      className={`perf-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setTraitKey(key)}
                    >
                      <div className="pbtn-label">{skill.label}</div>
                      {skill.presets && <div className="pbtn-desc">Presets: {skill.presets.join(', ')}</div>}
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
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Grade:</label>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option>All Grades</option>
            {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>
        <button className="sort-btn" onClick={() => setSortBy(sortBy === 'name' ? 'reverse' : 'name')}>
          ↕️ Sort by Name
        </button>
        <div className="showing-count">
          Showing {filtered.length} of {roster.length} athletes
        </div>
      </div>

      <div className={`sec ${m.group === 'scale' ? '' : 'gold'}`}>
        <div className="bar">
          <h3>Rate Athletes: {m.label}</h3>
          <p>{m.desc}</p>
        </div>
      </div>

      {filtered.map((p) => {
        const v = bankVal(myEvals[`${p.id}__w${week}`], m)
        return (
          <div className="athlete-row" key={p.id}>
            <div className="athlete-info">
              <div className="athlete-name">{p.name}</div>
              <div className="athlete-meta">{p.position} · {p.grade}</div>
            </div>
            <div className="athlete-control">
              <RowControl m={m} value={v} onChange={(val) => save(p, val)} />
            </div>
            {v != null && v !== '' && <div className="score-indicator">Score: {v}</div>}
          </div>
        )
      })}

      <div className="savebar">
        <div className="savebar-inner">
          <div className="target">
            <div className="tname">{m.label}</div>
            <div className="tstat">
              Rated {scored}/{filtered.length} · {submitInfo.count}/{submitInfo.total} coaches submitted Week {week}
            </div>
          </div>
          <button className={`save-btn ${submitInfo.submitted ? 'saved' : ''}`} onClick={submitInfo.onToggle}>
            {submitInfo.submitted ? (submitInfo.final ? 'Locked (final)' : 'Unsubmit') : 'Submit my Week'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RowControl({ m, value, onChange }) {
  if (m.group === 'scale') {
    return (
      <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={`rating-btn ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
    )
  }
  if (m.group === 'num' && m.buttons) {
    return (
      <div className="rating-buttons">
        {m.buttons.map((n) => (
          <button key={n} className={`rating-btn ${value === n ? 'active' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
        <button className={`rating-btn ${value === 'N/A' || value == null ? 'active' : ''}`} onClick={() => onChange(null)}>
          N/A
        </button>
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
