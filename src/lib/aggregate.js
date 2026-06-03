import { ALL, INTANGIBLES } from '../config/metrics'
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

// Position-weighted score per the tryout matrix formula (max ~100 pts).
// Inputs: approachTouch (inches), proAgility (seconds),
//         serveRating (0-3), passRating (0-3),
//         hitKills / hitErrors / hitInPlay (raw tally counts),
//         defenseDig (0-100 %), oosSet (0-100 %), intangible (1-5 avg)
function calcWeightedScore(position, s, intangible) {
  const D  = s.approachTouch ?? 0
  const E  = s.proAgility    ?? 6      // 6 s = worst-case (0 pts from agility)
  const F  = s.serveRating   ?? 0
  const G  = s.passRating    ?? 0
  const kK = s.hitKills      ?? 0
  const kE = s.hitErrors     ?? 0
  const kI = s.hitInPlay     ?? 0
  const H  = (kK + kE + kI) > 0 ? (kK - kE) / (kK + kE + kI) : 0
  const I  = (s.defenseDig   ?? 0) / 100
  const J  = (s.oosSet       ?? 0) / 100
  const Kv = intangible      ?? 1     // 1-5

  switch (position) {
    case 'OH':
      return (D/120)*15 + (F/3)*15 + (G/3)*25 + H*30 + I*15 + (Kv/5)*10
    case 'MB':
      return (D/120)*25 + ((6-E)/3)*20 + (F/3)*10 + H*30 + I*5 + (Kv/5)*10
    case 'S':
      return (D/120)*10 + ((6-E)/3)*15 + (F/3)*15 + I*15 + J*35 + (Kv/5)*10
    case 'L':
      return ((6-E)/3)*15 + (F/3)*15 + (G/3)*30 + I*25 + J*10 + (Kv/5)*5
    case 'DS':
      return ((6-E)/3)*10 + (F/3)*25 + (G/3)*25 + I*25 + (Kv/5)*15
    case 'OPP': case 'RS':
      return (D/120)*20 + (F/3)*15 + H*30 + I*15 + J*10 + (Kv/5)*10
    default:
      return null
  }
}

const TALLY_KEYS = new Set(['hitKills', 'hitErrors', 'hitInPlay'])

// Aggregate one player's scores across all coaches who submitted this week.
// A coach only counts toward `coaches` if they entered at least one real score.
export function aggregate(player, evals, subs) {
  const submitted = new Set(subs.map((s) => s.uid))
  const docs = evals.filter((e) => e.playerId === player.id && submitted.has(e.uid))

  const skillBuckets = {}
  const intBuckets   = {}
  const contributors = new Set()

  for (const e of docs) {
    const coachKey = e.coachKey || (evaluatorFor(e.coachEmail) || {}).key
    let counted = false

    for (const m of ALL) {
      if (TALLY_KEYS.has(m.key)) continue   // handled in the tally block below
      const v = bankVal(e, m)
      if (v == null || v === '') continue
      counted = true
      const w = weightFor(coachKey, player, m.bank)
      if (m.bank === 'intangible') {
        ;(intBuckets[m.key] = intBuckets[m.key] || []).push({ w, v })
      } else {
        ;(skillBuckets[m.key] = skillBuckets[m.key] || []).push({ w, v })
      }
    }

    // Tally keys are stored individually but averaged together
    for (const k of ['hitKills', 'hitErrors', 'hitInPlay']) {
      const v = e.skill?.[k]
      if (v == null) continue
      counted = true
      const w = weightFor(coachKey, player, 'skill')
      ;(skillBuckets[k] = skillBuckets[k] || []).push({ w, v })
    }

    if (counted) contributors.add(e.uid)
  }

  // Weighted average of each raw skill value across coaches
  const avgSkills = {}
  for (const [key, pts] of Object.entries(skillBuckets)) {
    avgSkills[key] = poolWeighted(pts)
  }

  // Weighted average of each intangible (1-5), then mean across traits
  const intVals = []
  for (const m of INTANGIBLES) {
    const pts = intBuckets[m.key]
    if (pts?.length) intVals.push(poolWeighted(pts))
  }
  const intangible = intVals.length
    ? intVals.reduce((a, b) => a + b, 0) / intVals.length
    : null

  const weighted = calcWeightedScore(player.position, avgSkills, intangible)

  return {
    coaches: contributors.size,
    intangible,        // 1–5 avg
    skills: avgSkills, // raw per-key averages
    overall: weighted, // position-weighted score (kept for ResultsView compat)
    weighted,
  }
}
