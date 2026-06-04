import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useRoster, useMyEvals, useWeekData } from './hooks/useData'
import { setSubmission, clearSubmission, addPlayer } from './services/db'
import { EVAL_TOTAL } from './config/roles'
import { WEEKS } from './config/metrics'
import AppBar from './components/AppBar'
import ModeTabs from './components/ModeTabs'
import AthleteView from './views/AthleteView'
import TraitView from './views/TraitView'
import IntangiblesView from './views/IntangiblesView'
import ResultsView from './views/ResultsView'

export default function App() {
  const auth = useAuth()
  const { user, ready, isStaff, isHead, isEvaluator, coachKey } = auth

  const [mode, setMode] = useState('athlete')
  const [week, setWeek] = useState(1)
  const [playerId, setPlayerId] = useState('')
  const [traitKey, setTraitKey] = useState('approachTouch')

  const roster = useRoster(isStaff)
  const myEvals = useMyEvals(user?.uid)
  const { evals, subs } = useWeekData(week, isStaff)

  useEffect(() => { if (!isEvaluator) setMode('results') }, [isEvaluator])

  if (!ready) return <Shell><p className="pending">Loading…</p></Shell>
  if (!user) return <Shell><div className="notice">Sign in with your team Google account to continue.</div></Shell>
  if (!isStaff) return <Shell><div className="notice">This account isn't on the Barlow staff list.</div></Shell>

  const iSubmitted = subs.some((s) => s.uid === user.uid)
  const weekFinal = new Set(subs.map((s) => s.uid)).size >= EVAL_TOTAL
  const locked = iSubmitted

  async function toggleSubmit() {
    if (iSubmitted) {
      if (weekFinal) return alert(`Week ${week} is final and locked.`)
      if (confirm(`Unsubmit Week ${week} so you can edit again?`)) await clearSubmission({ week, user })
    } else if (confirm(`Submit your Week ${week} evaluations?`)) {
      await setSubmission({ week, user, coachKey })
    }
  }

  async function onAddPlayer(form) {
    await addPlayer(form, user.email)
  }

  return (
    <Shell>
      <div className="ctx">
        <div className="goldbar" />
        <h1>Athlete Evaluations</h1>
        <div className="csub">Each coach evaluates separately · scores combine into a weighted team result</div>

        <ModeTabs mode={mode} setMode={setMode} isEvaluator={isEvaluator} />

        <div className="pickrow">
          {mode === 'athlete' && (
            <div className="field">
              <label>Athlete</label>
              <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                <option value="">Select roster…</option>
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.grade} {p.position})</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label>Week</label>
            <select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
              {WEEKS.map((w) => <option key={w.n} value={w.n}>{w.t}</option>)}
            </select>
          </div>
        </div>

        {isEvaluator && mode !== 'results' && (
          <div className="submitline">
            <span className={`lockbadge ${iSubmitted ? 'done' : 'open'}`}>{iSubmitted ? 'You submitted' : 'Open'}</span>
            <button className="btn btn-line" onClick={toggleSubmit}>
              {iSubmitted ? (weekFinal ? 'Locked (final)' : 'Unsubmit') : 'Submit my Week'}
            </button>
            <span className="csub-count">{new Set(subs.map((s) => s.uid)).size} / {EVAL_TOTAL} submitted Week {week}</span>
          </div>
        )}

        {isHead && <AddPlayer onAdd={onAddPlayer} />}
      </div>

      {mode === 'athlete' && (
        <AthleteView {...{ roster, myEvals, week, user, coachKey, playerId, locked }} />
      )}
      {mode === 'trait' && (
        <TraitView {...{ roster, myEvals, week, user, coachKey, traitKey, setTraitKey, locked }} />
      )}
      {mode === 'intangibles' && (
        <IntangiblesView {...{ roster, myEvals, week, user, coachKey, locked }} />
      )}
      {mode === 'results' && (
        <ResultsView {...{ roster, week, evals, subs }} />
      )}
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <>
      <AppBar />
      <div className="sheet">
        <main>{children}</main>
      </div>
    </>
  )
}

function AddPlayer({ onAdd }) {
  const [f, setF] = useState({ name: '', grade: '', position: '', gpa: '', returning: 'false' })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  async function submit() {
    if (!f.name.trim()) return
    await onAdd({
      name: f.name.trim(),
      grade: f.grade,
      position: f.position.trim().toUpperCase(),
      gpa: f.gpa === '' ? null : Number(f.gpa),
      returning: f.returning === 'true',
    })
    setF({ name: '', grade: '', position: '', gpa: '', returning: 'false' })
  }
  return (
    <div className="addrow">
      <input className="nm" placeholder="New player name" value={f.name} onChange={(e) => set('name', e.target.value)} />
      <select value={f.grade} onChange={(e) => set('grade', e.target.value)}>
        <option value="">Grade</option><option>FR</option><option>SO</option><option>JR</option><option>SR</option>
      </select>
      <input style={{ width: 70 }} placeholder="Pos" value={f.position} onChange={(e) => set('position', e.target.value)} />
      <input style={{ width: 80 }} type="number" step="0.1" min="0" max="4.5" placeholder="GPA" value={f.gpa} onChange={(e) => set('gpa', e.target.value)} />
      <select value={f.returning} onChange={(e) => set('returning', e.target.value)}>
        <option value="false">New</option><option value="true">Returning</option>
      </select>
      <button className="btn btn-quiet" onClick={submit}>+ Add</button>
    </div>
  )
}
