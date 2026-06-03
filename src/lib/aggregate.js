import { ALL, norm } from '../config/metrics'
import { weightFor, evaluatorFor } from '../config/roles'

export function bankVal(rec, m) {
  if (!rec || !rec[m.bank]) return null
  const v = rec[m.bank][m.key]
  return v === undefined ? null : v
}

function poolWeighted(list) {
  let sw = 0, sv = 0
  for (const { w, v } of list) { sw += w; sv += w * v }
  return sw ? sv / sw : null
}

// Aggregate one player's scores across all coaches who submitted this week.
// A coach only counts toward `coaches` if they entered at least one real score
// (notes-only docs do not count).
export function aggregate(player, evals, subs) {
  const submitted = new Set(subs.map((s) => s.uid))
  const docs = evals.filter((e) => e.playerId === player.id && submitted.has(e.uid))

  const intPts = [], skillPts = [], allPts = []
  const contributors = new Set()

  for (const e of docs) {
    const coachKey = e.coachKey || (evaluatorFor(e.coachEmail) || {}).key
    let counted = false
    for (const m of ALL) {
      const v = bankVal(e, m)
      if (v == null || v === '') continue
      counted = true
      const w = weightFor(coachKey, player, m.bank)
      if (m.bank === 'intangible') {
        intPts.push({ w, v })                 // raw 1-3
        allPts.push({ w, v: norm(m, v) })     // 0-100
      } else {
        skillPts.push({ w, v: norm(m, v) })   // 0-100
        allPts.push({ w, v: norm(m, v) })
      }
    }
    if (counted) contributors.add(e.uid)
  }

  return {
    coaches: contributors.size,
    intangible: intPts.length ? poolWeighted(intPts) : null, // 1-3
    skills: skillPts.length ? poolWeighted(skillPts) : null,  // 0-100
    overall: allPts.length ? poolWeighted(allPts) : null,     // 0-100
  }
}
