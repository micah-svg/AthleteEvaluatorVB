export const INTANGIBLES = [
  { key: 'motorCoverage',   label: 'Motor & Coverage', short: 'Motor' },
  { key: 'vocalLeadership', label: 'Vocal Leadership', short: 'Lead' },
  { key: 'errorRecovery',   label: 'Error Recovery',   short: 'Recov' },
].map((m) => ({ ...m, bank: 'intangible', group: 'int5' }))

export const SKILLS = [
  // Physical
  { key: 'approachTouch', bank: 'skill', group: 'inches',    label: 'Approach Touch',    short: 'Touch',   desc: 'Max reach in inches (9\'6" = 114")',                     min: 60,  max: 150, step: 1,   ph: '114' },
  { key: 'proAgility',    bank: 'skill', group: 'seconds',   label: 'Pro Agility',        short: 'Agility', desc: 'Time in seconds — lower is faster',                      min: 3.5, max: 7.0, step: 0.1, ph: '4.8' },
  // Serving
  { key: 'serveRating',   bank: 'skill', group: 'rating03',  label: 'Serve Rating',       short: 'Serve',   desc: '0=Error · 1=Free Ball · 2=OOS Out · 3=Ace/Overpass',    buttons: [0, 1, 2, 3] },
  // Passing & Digging
  { key: 'passRating',    bank: 'skill', group: 'rating03',  label: 'Pass / Dig Rating',  short: 'Pass',    desc: '0=Ace/Shank · 1=1-Option · 2=2-Option · 3=Perfect',      buttons: [0, 1, 2, 3] },
  // Transition Hitting (tally: hitKills drives the UI; hitErrors + hitInPlay are co-saved)
  { key: 'hitKills',      bank: 'skill', group: 'tally',     label: 'Transition Hitting', short: 'Hit%',    desc: 'Enter K · E · IP tallies — app calculates efficiency' },
  { key: 'hitErrors',     bank: 'skill', group: 'tallyPart', label: 'Hit Errors' },
  { key: 'hitInPlay',     bank: 'skill', group: 'tallyPart', label: 'Hit In-Play' },
  // Defense
  { key: 'defenseDig',    bank: 'skill', group: 'pct',       label: 'Defense / Dig %',    short: 'Dig%',    desc: 'Digs successfully converted (0–100%)' },
  // Setting
  { key: 'oosSet',        bank: 'skill', group: 'pct',       label: 'OOS Set %',           short: 'OOS%',    desc: 'Out-of-system sets delivered on target (0–100%)' },
]

export const SKILL_CATS = [
  { title: 'Physical', accent: 'royal', keys: ['approachTouch', 'proAgility'] },
  { title: 'Serving',  accent: 'gold',  keys: ['serveRating'] },
  { title: 'Passing',  accent: 'gold',  keys: ['passRating'] },
  { title: 'Hitting',  accent: 'royal', keys: ['hitKills'] },
  { title: 'Defense',  accent: 'gold',  keys: ['defenseDig'] },
  { title: 'Setting',  accent: 'royal', keys: ['oosSet'] },
]

export const ALL = [...INTANGIBLES, ...SKILLS]
export const byKey = Object.fromEntries(ALL.map((m) => [m.key, m]))

// Normalize a raw value to 0–100 for generic display (not used in the position formula).
export function norm(m, v) {
  if (v == null || v === '') return null
  if (m.group === 'int5')    return ((v - 1) / 4) * 100
  if (m.group === 'rating03') return (v / 3) * 100
  if (m.group === 'inches')  return Math.min((v / 120) * 100, 100)
  if (m.group === 'seconds') return Math.max(0, Math.min(((6 - v) / 3) * 100, 100))
  if (m.group === 'pct')     return v
  return null
}

export function numFmt(m, v) {
  return Number(v).toFixed(m.dec || 1)
}

export const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  n,
  t: n === 1 ? 'Week 1 (Tryouts)' : 'Week ' + n,
}))

export const POS_ORDER = ['S', 'OH', 'OPP', 'RS', 'MB', 'L', 'DS']
export const gradeRank = (g) => ({ SR: 4, JR: 3, SO: 2, FR: 1 }[g] || 0)
export function posName(g) {
  return {
    S: 'Setters', OH: 'Outside Hitters', OPP: 'Opposites', RS: 'Right Sides',
    MB: 'Middle Blockers', L: 'Liberos', DS: 'Defensive Specialists', Other: 'Other',
  }[g] || g
}
