// Intangibles are scored 1-3 in their own table. Skills are scored weekly.

export const INTANGIBLES = [
  { key: 'growthMindset',  label: 'Growth Mindset',        short: 'Growth' },
  { key: 'reset',          label: 'Reset & Body Language', short: 'Reset' },
  { key: 'leadership',     label: 'Leadership',            short: 'Lead' },
  { key: 'effort',         label: 'Effort',                short: 'Effort' },
  { key: 'teamPlayer',     label: 'Team Player',           short: 'Team' },
  { key: 'decisionMaking', label: 'Decision Making',       short: 'Decision' },
  { key: 'playMaker',      label: 'Play Maker',            short: 'Playmkr' },
  { key: 'volleyballIq',   label: 'Volleyball IQ',         short: 'IQ' },
].map((m) => ({ ...m, bank: 'intangible', group: 'int3' }))

export const SKILLS = [
  { key: 'serveReceive',       bank: 'skill', group: 'num',   label: 'Serve Receive Index',   min: 0, max: 3, step: 0.1, dec: 1, ph: '2.2', presets: [1, 2, 3], buttons: [0, 1, 2, 3], desc: '0.0-3.0 passing avg' },
  { key: 'defensiveRange',     bank: 'skill', group: 'scale', label: 'Defensive Range',       desc: 'Floor covered, OOA digs (1-5)' },
  { key: 'liberoHandSet',      bank: 'skill', group: 'pct',   label: 'OOS Hand-Set Accuracy %', desc: 'Hittable / OOS hand-set attempts' },
  { key: 'bounceBack',         bank: 'skill', group: 'pct',   label: 'Passer Bounce-Back %',  desc: '2.0+ passes right after an error' },
  { key: 'lineShot',           bank: 'skill', group: 'pct',   label: 'Line Shot %',           desc: 'Line conversion' },
  { key: 'crossCourt',         bank: 'skill', group: 'pct',   label: 'Cross-Court %',         desc: 'Cross conversion' },
  { key: 'rollShot',           bank: 'skill', group: 'pct',   label: 'Roll Shot %',           desc: 'Off-speed conversion' },
  { key: 'oosEfficiency',      bank: 'skill', group: 'num',   label: 'OOS Hitting Efficiency', min: -0.5, max: 1, step: 0.05, dec: 2, ph: '0.25', presets: [0, 0.25, 0.5], desc: '(K-E)/attempts vs double block' },
  { key: 'blockPenetration',   bank: 'skill', group: 'scale', label: 'Block Penetration',     desc: 'Hands over the tape (1-5)' },
  { key: 'blockCloseout',      bank: 'skill', group: 'pct',   label: 'Block Close-Out %',     desc: 'Middle seals the double' },
  { key: 'transitionFootwork', bank: 'skill', group: 'scale', label: 'Transition Footwork',   desc: 'Explosive reset to approach (1-5)' },
]

export const SKILL_CATS = [
  { title: 'Defense & First Contact', accent: 'gold',  keys: ['serveReceive', 'defensiveRange', 'liberoHandSet', 'bounceBack'] },
  { title: 'Attack',                  accent: 'royal', keys: ['lineShot', 'crossCourt', 'rollShot', 'oosEfficiency'] },
  { title: 'Blocking',                accent: 'gold',  keys: ['blockPenetration', 'blockCloseout'] },
  { title: 'Transition',              accent: 'royal', keys: ['transitionFootwork'] },
]

export const ALL = [...INTANGIBLES, ...SKILLS]
export const byKey = Object.fromEntries(ALL.map((m) => [m.key, m]))

// Normalize any metric value to 0-100 for comparable aggregation.
export function norm(m, v) {
  if (v == null || v === '') return null
  if (m.group === 'int3') return ((v - 1) / 2) * 100
  if (m.group === 'scale') return ((v - 1) / 4) * 100
  if (m.key === 'serveReceive') return (v / 3) * 100
  if (m.key === 'oosEfficiency') return ((v + 0.5) / 1.5) * 100
  if (m.group === 'pct') return v
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
