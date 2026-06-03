import { useEffect, useState } from 'react'
import { aggregate } from '../lib/aggregate'
import { EVAL_TOTAL, SHOW_THRESHOLD } from '../config/roles'
import { POS_ORDER, gradeRank, posName } from '../config/metrics'
import { fetchWeek } from '../services/db'

export default function ResultsView({ roster, week, evals, subs }) {
  const [prev, setPrev] = useState({ evals: [], subs: [] })

  useEffect(() => {
    let on = true
    if (week > 1) fetchWeek(week - 1).then((d) => { if (on) setPrev(d) })
    else setPrev({ evals: [], subs: [] })
    return () => { on = false }
  }, [week])

  const submittedCount = new Set(subs.map((s) => s.uid)).size
  const final = submittedCount >= EVAL_TOTAL

  const groups = {}
  roster.forEach((p) => {
    const g = POS_ORDER.includes(p.position) ? p.position : 'Other'
    ;(groups[g] = groups[g] || []).push(p)
  })
  const order = [...POS_ORDER.filter((g) => groups[g]), ...(groups['Other'] ? ['Other'] : [])]

  return (
    <div>
      {final ? (
        <div className="finalbar">Week {week} · FINAL — all {EVAL_TOTAL} coaches submitted</div>
      ) : (
        <div className="progbar">
          Week {week} · in progress — {submittedCount} / {EVAL_TOTAL} coaches submitted
          {week > 1 ? ` · trend vs Week ${week - 1}` : ''}
        </div>
      )}

      {order.map((g) => {
        const rows = groups[g]
          .map((p) => {
            const a = aggregate(p, evals, subs)
            let prevWeighted = null
            if (week > 1) {
              const pa = aggregate(p, prev.evals, prev.subs)
              if (pa.coaches >= SHOW_THRESHOLD) prevWeighted = pa.weighted
            }
            return { p, a, prevWeighted }
          })
          .sort((x, y) => {
            const gr = gradeRank(y.p.grade) - gradeRank(x.p.grade)
            if (gr) return gr
            return (y.a.weighted ?? -1) - (x.a.weighted ?? -1)
          })
        return (
          <div className="grp" key={g}>
            <h2>{posName(g)}</h2>
            {rows.map(({ p, a, prevWeighted }) => (
              <ResultRow key={p.id} player={p} a={a} prevWeighted={prevWeighted} week={week} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ResultRow({ player, a, prevWeighted, week }) {
  const ready = a.coaches >= SHOW_THRESHOLD
  return (
    <div className="rcard">
      <div className="rinfo">
        <div className="rn">{player.name}</div>
        <div className="rgrade">
          {player.grade} · {player.position}{player.returning ? ' · returning' : ''} ·{' '}
          <span className="csub-count">{a.coaches}/{EVAL_TOTAL} in</span>
        </div>
      </div>
      <div className="rscores">
        {!ready ? (
          <span className="pending">Pending · {a.coaches}/{SHOW_THRESHOLD} coaches</span>
        ) : (
          <>
            <Score label="Score" value={a.weighted != null ? a.weighted.toFixed(1) : '–'} />
            <Score label="Intang" gold value={a.intangible != null ? `${a.intangible.toFixed(1)}/5` : '–'} />
            {week > 1 && <Trend weighted={a.weighted} prev={prevWeighted} />}
          </>
        )}
      </div>
    </div>
  )
}

function Score({ label, value, gold }) {
  return (
    <div className="score">
      <div className="lab">{label}</div>
      <div className={`val ${gold ? 'gold' : ''}`}>{value}</div>
    </div>
  )
}

function Trend({ weighted, prev }) {
  if (prev == null) return <div className="trend flat">— new</div>
  const d = weighted - prev
  const cls = d > 2 ? 'up' : d < -2 ? 'down' : 'flat'
  const arrow = d > 2 ? '▲' : d < -2 ? '▼' : '▬'
  return <div className={`trend ${cls}`}>{arrow} {d > 0 ? '+' : ''}{d.toFixed(1)}</div>
}
