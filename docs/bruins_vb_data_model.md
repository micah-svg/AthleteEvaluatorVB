# Bruins Volleyball Evaluation — Firestore Data Model

**Design principle:** capture raw observations, decide scoring later. Every collection here stores facts that do not change based on the head coach's philosophy. Weighting, normalization, cut lines, and JV/JV2 differentials are deliberately NOT in this model. They sit on top and get tuned from the coach questionnaire.

**Position codes used throughout:** S = Setter, OH = Outside Hitter, OPP = Opposite / Right Side, MB = Middle Blocker, L = Libero, DS = Defensive Specialist.

---

## Collections at a glance

```
athletes        one doc per player (the roster + bio + coach-assigned fields)
evaluators      one doc per coach/scorer (makes every score attributable)
sessions        one doc per tryout or camp block (when/where a score happened)
metrics         registry of what gets measured (the capture catalog)
evaluations     the core capture record: who scored whom, on what, when
```

How they link: an **evaluation** references an **athlete**, an **evaluator**, a **session**, and a **metric**. Those four are the keys; the evaluation holds the raw reps.

---

## 1. `athletes`

Document ID: `athleteId` (e.g. `BVB-014`). Already loaded.

| Field | Type | Source |
|---|---|---|
| athleteId | string | generated |
| firstName, lastName, fullName | string | signup |
| playerEmail, playerPhone | string | signup / check-in |
| gradeLevel | string | signup |
| gradeNumeric | number | derived |
| guardianName, guardianEmail, guardianPhone | string | signup / check-in |
| previousSchool | string | signup |
| isReturning | boolean | derived |
| experienceLevel | string | signup |
| experienceYearsApprox | number | derived |
| positionsInterested | array | signup (athlete's stated interest) |
| tryoutNumber | number | check-in (pinnie number for courtside ID) |
| heightInches | number | check-in |
| handedness | string | check-in |
| primaryPosition, secondaryPosition | string | coach-assigned |
| teamAssignment | string | coach-assigned (V / JV / JV2) |
| eligibilityStatus | string | check-in |
| photoUrl | string | check-in (headshot in Firebase Storage) |
| status | string | active / withdrawn / injured / cut |

---

## 2. `evaluators`

Document ID: `evaluatorId` (e.g. `EVAL-01`).

| Field | Type | Notes |
|---|---|---|
| evaluatorId | string | |
| name | string | |
| role | string | head_coach / assistant / evaluator |
| authUid | string | links to the Firebase Auth user, for security rules |
| active | boolean | |

---

## 3. `sessions`

Document ID: `sessionId` (e.g. `camp-day-1`).

| Field | Type | Notes |
|---|---|---|
| sessionId | string | |
| name | string | "Elite Camp Day 1 — Ball Control & Serving" |
| type | string | camp / tryout / physical |
| date | string | fill in actual date |
| focusMetrics | array | metricKeys naturally observed that block (drives which screens surface) |

---

## 4. `metrics`

Document ID: `metricKey` (e.g. `serveRating`). This is the capture catalog from the app.

| Field | Type | Notes |
|---|---|---|
| metricKey | string | also used as `metricKey` on evaluations |
| label | string | display name |
| category | string | Physical / Serving / Passing / Defense / Hitting / Setting / Blocking / Intangibles |
| inputType | string | see vocabulary below |
| repBased | boolean | true = logs raw reps; false = single measured value |
| appliesTo | array | position codes for which the metric is relevant |
| scaleLegend | map | meaning of each value, for the UI |

**inputType vocabulary:**
- `scale_0_3` — tap rating per rep (serve, serve receive)
- `scale_0_2` — tap rating per rep (dig, set, block)
- `tally_KEIP` — each swing is Kill / Error / In-Play
- `inches` — single measured value (approach touch, block touch)
- `seconds` — single measured value (pro agility; lower is faster)
- `scale_1_5` — single observed rating per session (intangibles)

Note: error rates are NOT a separate metric. Because raw reps are stored, service-error % and hitting-error % fall out of the rep data automatically.

---

## 5. `evaluations` — the core capture record

Document ID: auto-generated. One document per (athlete, evaluator, session, metric). When an evaluator adds more reps in the same session, append to the same document.

```jsonc
{
  "athleteId":   "BVB-014",
  "evaluatorId": "EVAL-01",
  "sessionId":   "camp-day-1",
  "metricKey":   "serveRating",

  // rep-based metrics (scale_0_3, scale_0_2): raw values in the order tapped
  "reps": [3, 2, 0, 3, 1, 2],
  "repCount": 6,

  // tally_KEIP stores reps as strings so efficiency is recomputable:
  // "reps": ["K", "E", "IP", "K", "IP"]

  // single-measure metrics (inches, seconds, scale_1_5) use value instead of reps:
  // "value": 114,

  "note": "",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>",
  "deleted": false
}
```

**Why raw reps:** storing `[3,2,0,3,1,2]` instead of just "avg 1.83" means you can later compute the average, the error rate (count of 0s), a weighted score, a trend across the session, or anything the coach asks for, without re-collecting data. Nothing is thrown away before the weighting decision is made. `deleted: false` lets a mis-tap be soft-removed without losing the audit trail.

---

## Cross-cutting, before live use

- **Security rules:** only authenticated evaluators can read `athletes` and write `evaluations`. Scope writes so an evaluator can only edit their own records.
- **Timestamps + edit/delete:** every evaluation carries createdAt / updatedAt and a `deleted` flag for corrections.
- **Composite indexes:** add as the real queries get built (e.g. evaluations by sessionId + metricKey, or athleteId + metricKey).

## Deferred until the questionnaire comes back

Position weights, normalization to a ranked score, roster-count cut lines, JV/JV2 differential weighting, and intangible weighting. None of these change anything above; they consume this data, they do not reshape it.
