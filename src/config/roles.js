// Who can do what, and how each coach's scores are weighted.

export const HEAD_COACHES = [
  'barlowbruins.volleyball@gmail.com', // Lihau Perreira - Program/Varsity Head
  'micahmariewilson@gmail.com',        // Micah Wilson - JV Head
  'mary.bredenkamp2015@gmail.com',     // Mary Bredenkamp - JV2 Head
]

export const STAFF = [
  'barlowbruins.volleyball@gmail.com',
  'micahmariewilson@gmail.com',
  'mary.bredenkamp2015@gmail.com',
  'kelsey.merritt.ghs@gmail.com', // Kelsey Schreiber - Volunteer Varsity Assistant (view only)
  'josiejansen11@gmail.com',
  'quirke2@gresham.k12.or.us',
  'micah@futureplaysports.info',  // dev / admin access
]

// Evaluators mapped by email → evaluatorId key used in Firestore evaluations docs.
// Kelsey is view-only (scores not counted in aggregation).
export const EVALUATORS = {
  'barlowbruins.volleyball@gmail.com': { key: 'lihau',  name: 'Lihau Perreira',   viewOnly: false },
  'micahmariewilson@gmail.com':        { key: 'micah',  name: 'Micah Wilson',      viewOnly: false },
  'mary.bredenkamp2015@gmail.com':     { key: 'mary',   name: 'Mary Bredenkamp',   viewOnly: false },
  'quirke2@gresham.k12.or.us':         { key: 'tai',    name: 'Tai Quirke',        viewOnly: false },
  'josiejansen11@gmail.com':           { key: 'josie',  name: 'Josie Quirken',     viewOnly: false },
  'kelsey.merritt.ghs@gmail.com':      { key: 'kelsey', name: 'Kelsey Schreiber',  viewOnly: true  },
  'micah@futureplaysports.info':       { key: 'micah',  name: 'Micah Wilson',      viewOnly: false },
}

export const EVAL_TOTAL = Object.keys(EVALUATORS).length // 5
export const SHOW_THRESHOLD = 3 // show aggregate once this many coaches submitted for an athlete

export function evaluatorFor(email) {
  return EVALUATORS[(email || '').toLowerCase()] || null
}

// Weight for a coach's score on a given player. cat = 'intangible' | 'skill'.
export function weightFor(coachKey, player, cat) {
  switch (coachKey) {
    case 'lihau': return player.returning ? 1.2 : 1.0
    case 'micah': return 0.9
    case 'mary':  return player.grade === 'FR' ? 1.0 : player.grade === 'SO' ? 1.1 : 1.0
    case 'tai':   return cat === 'skill' ? 1.1 : 1.0
    case 'josie': return cat === 'intangible' ? 0.5 : 0.9
    default:      return 1.0
  }
}
