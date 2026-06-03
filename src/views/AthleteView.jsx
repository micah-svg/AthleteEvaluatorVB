import { useEffect, useState } from 'react'
import { saveNotes } from '../services/db'

// By Athlete = general notes only. No scoring happens here.
export default function AthleteView({ roster, myEvals, week, user, coachKey, playerId, locked }) {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const rec = myEvals[`${playerId}__w${week}`]
    setNotes(rec?.notes || '')
  }, [playerId, week, myEvals])

  const player = roster.find((p) => p.id === playerId)

  async function save() {
    if (!player || locked) return
    await saveNotes({ player, week, user, coachKey, notes })
    setSaved(true); setTimeout(() => setSaved(false), 1400)
  }

  if (!player) return <p className="pending">Pick an athlete above to add notes.</p>

  return (
    <div>
      <div className="sec">
        <div className="bar">
          <h3>General Notes</h3>
          <p>{player.name} · Week {week}. Observations only — scoring lives in By Skill and Intangibles.</p>
        </div>
      </div>
      <div className="metric">
        <textarea
          value={notes}
          disabled={locked}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What you saw this week: strengths, what to work on, anything for the staff…"
          style={{
            width: '100%', minHeight: 200, padding: 12, fontSize: '1rem',
            fontFamily: 'inherit', color: 'var(--ink)', background: '#fff',
            border: '1.5px solid var(--line)', borderRadius: 11, resize: 'vertical',
          }}
        />
      </div>

      <div className="savebar">
        <div className="savebar-inner">
          <div className="target">
            <div className="tname">{player.name}</div>
            <div className="tstat">{locked ? `Week ${week} submitted — locked` : `Week ${week} · notes`}</div>
          </div>
          <button className={`save-btn ${saved ? 'saved' : ''}`} disabled={locked} onClick={save}>
            {saved ? 'Saved' : 'Save notes'}
          </button>
        </div>
      </div>
    </div>
  )
}
