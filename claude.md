# Bruins Volleyball Evaluation System — Project Context & Dev Plan

Paste this into Claude Code as project context, or save at repo root as `CLAUDE.md`.

## 1. What this is
A data-informed athlete evaluation system for Sam Barlow High School (Bruins) volleyball, used at tryouts to build a 6A Oregon varsity, JV, and JV2. Goal: replace hand-tallied paper evals with objective, position-fair, multi-coach scoring that produces per-athlete reference cards and an adjustable ranked board, ending in roster-setting and athlete letters.

## 2. Apps, repos, hosting
Two front ends, one shared Firebase project.
- **Coaches' Dashboard + Roster** — static HTML/JS multi-page site (Netlify). Pages: `index.html` (dashboard with cards), `roster.html`. Also hosts a Practice Plan app (collections `library`, `plans/{}/blocks/{}/notes`).
- **Evaluation app** — React + Vite (Netlify, bruinseval26.netlify.app). Main screen is the mobile capture flow. Structure: `src/App.jsx`, `src/views/`, `src/components/`, `src/firebase.js`, `src/hooks/`, `src/services/`. Capture screen lives at `src/views/EvaluationCapture.jsx`.
- **Admin scripts** — `scripts/` folder, run locally with the Firebase Admin SDK. Contains `import_athletes.js`, `seed_collections.js`, `update_athletes.js`, `verify_athletes.js`, and `serviceAccountKey.json` (GITIGNORED, never commit). The athlete CSV is also gitignored (it holds minors' PII).
- The dashboard's Evaluations card is an external link to the eval app's URL (separate deploys), not an in-app route.

## 3. Stack & conventions
- Firebase: Firestore + Google Auth. Web SDK in the apps; Admin SDK only in `scripts/`.
- Brand: royal blue `#1A3CA0`, athletic gold `#FCB712`, cream paper `#FAF6EB`/`#FCFBF7`, dark navy ink `#14213E`. Fonts: Barlow Condensed (display, uppercase), DM Sans (body).
- Mobile-first, iPhone-optimized (capture happens courtside on phones).
- Voice for any generated copy (letters, athlete-facing text): direct, punchy, short declarative sentences, no em dashes, no emojis.

## 4. Firebase data model (project: barlowvball26)
All evaluation collections are top-level and keyed by `athleteId` so both apps share them.

- **athletes/{athleteId}** (doc id like `BVB-014`): firstName, lastName, fullName, playerEmail, playerPhone, gradeLevel, gradeNumeric, guardianName, guardianEmail, guardianPhone, previousSchool, isReturning(bool), experienceLevel, experienceYearsApprox, positionsInterested(array, athlete's stated interest), tryoutNumber, heightInches, handedness, primaryPosition, secondaryPosition (coach-assigned codes S/OH/OPP/MB/L/DS), teamAssignment (V/JV/JV2/cut), attendance(map of 3 tryout days), eligibilityStatus (eligible/ineligible_grades/pending), status (active/withdrawn/injured/cut), dailyStatus(map), jerseySize, photoUrl. 74 athletes loaded.
- **evaluators/{evaluatorId}**: name, role, authUid, isHeadCoach(bool), active. 6 coaches. (Not yet created.)
- **sessions/{sessionId}**: name, type (tryout/camp), scoring(bool), dayNumber, date, focusMetrics(array). Seeded: tryout-day-1/2/3 (scoring), camp (not scored).
- **metrics/{metricKey}**: label, category, axis (physical/performance/culture), inputType (scale_0_3 | scale_0_2 | tally_KEIP | inches | seconds | scale_1_5), repBased(bool), appliesTo(array of position codes), scaleLegend(map). 13 metrics seeded.
- **evaluations/{auto}**: athleteId, evaluatorId, **uid** (scoring coach's auth uid — REQUIRED by security rules), sessionId, metricKey, reps(array of raw values in tap order; KEIP stored as ["K","E","IP"]), repCount, value (for single-measure metrics), note, createdAt, updatedAt, deleted(bool). One doc per (athlete, evaluator, session, metric). STORE RAW REPS, never pre-averaged.
- **notes/{auto}**: athleteId, text, author, email, uid, source ("roster"|"eval-app"), createdAt. Shared athlete notes across both apps.

Security rules (firestore.rules, already written and deployed): `staff()` (6 coaches + micah@futureplaysports.info) and `head()` (4) roles. Athletes/metrics/sessions/evaluators read=staff, write=head. Evaluations read=staff, create/update by owner (uid match), delete=false. Notes read=staff, create by owner, delete own, no update.

## 5. Metrics (the capture catalog)
Physical (axis=physical, single value): approachTouch (inches), blockTouch (inches), proAgility (seconds, lower=faster).
Performance (axis=performance, rep-based): serveRating (0-3), serveReceiveRating (0-3), defenseDig (0-2), transitionHitting (K/E/IP), oosSet (0-2), blocking (0-2).
Culture (axis=culture, scale 1-5, single rating): compete, volleyballIQ, communication, coachability.
Error rates are derived from raw reps, not separate metrics.

## 6. Head coach questionnaire findings (these drive the build)
- Team identity: **ball control is #1, defense is the strength.** They are not heavy hitters and face bigger teams, so weight passing/serve receive/defense ABOVE hitting.
- Offense: **6-2** (two setters who also hit/block front row; wants 3 setters; needs a setter who learns fast). Defense: perimeter read.
- Roster total **14**: Setter 3, Outside 3, Opposite 2, Middle 3, Libero 1, DS 2. **10 returning, only 4 open varsity spots.** Versatility matters most at setter and middle.
- JV/JV2: competitive but developmental; **weigh potential and athleticism over current fundamentals** at lower levels. No mid-season team movement (placements final). Do NOT build call-up flagging.
- Data appetite: **4 of 5 toward objective data.** Trusts in-drill numbers, her eye, staff consensus, physical testing, and intangibles. Willing to structure tryouts only if it does not slow things down. Wants a **per-athlete reference page showing all areas plus where they need to improve.** Treats a ranked list as a starting point she then adjusts.
- Logistics: she evaluates some days, runs drills others. **All 6 coaches submit scores; each head coach is final decider, others weigh in** (multi-evaluator aggregation with visible spread). Open to data-capturing drills. **No scoring at camp** — evals happen across **3 dedicated tryout days.** Athletes wear **name tags, not numbers** (name-first UI).
- Intangibles: rated **5 of 5, can override skill.** That is the "culture" axis. Auto-disqualifiers: missing any of the 3 tryout days, or prior-year academic ineligibility. Effort/attitude can cut after warnings. She bets on "yes coach", 100% effort, coachable players.
- Priority ranking (1=top): 1 consistent comparable data, 2 position-fair scoring, 3 fast/simple tryouts, 4 intangibles/culture fit, 5 free her up to evaluate, 6 override flexibility, 7 speed of final lists, 8 parent-defensible rankings (lowest; she keeps parents out). **Deprioritize parent-facing reporting.**
- Wants: roster builder + **generated acceptance/cut letters** (printable or email), handed discreetly at end of day (she dislikes the current cut process). **End-of-day athlete status** (e.g. strong contender / needs improvement). Post-tryout intake (jersey size).

## 7. Scoring model spec (to build; her #1 and #2 priorities)
- Normalize each metric to a common 0-100 scale (percentile within the camp/tryout pool is cleanest for small N) before weighting.
- Composite uses **per-position weights** so a position is never penalized for a metric it does not perform. Draft weights for a 6-2, defense-first program (skill weights sum to 100 per position; tune with coach):

| Metric | S | OH | OPP | MB | Libero | DS |
|---|---|---|---|---|---|---|
| Serve | 15 | 15 | 15 | 15 | 10 | 25 |
| Serve receive | 5 | 30 | 10 | 5 | 40 | 35 |
| Hitting eff. | 15 | 20 | 25 | 25 | 0 | 0 |
| Blocking | 15 | 10 | 25 | 35 | 0 | 0 |
| Setting | 35 | 5 | 5 | 5 | 10 | 5 |
| Defense/dig | 15 | 20 | 20 | 15 | 40 | 35 |

- **Culture axis (compete, coachability, communication, volleyballIQ) is a separate override**, not folded into skill weights. It can lift a bubble athlete above a more skilled one and, after documented warnings, flag one down.
- Aggregate across the 6 evaluators per athlete/metric; show mean and spread; head coach decides.
- JV/JV2 run the same metrics with a profile that weights physical ceiling and potential higher than current polish.
- Compute composites under both primary and secondary position; surface versatility.

## 8. Build status
Done: roster imported (74), data model v2, metrics + sessions seeded, capture screen UI (mock data, name-first, axis-aware, raw-reps), roster page reading athletes with cross-app notes, security rules, PII git-history cleanup.
Not done: everything in section 9.

## 9. Remaining build plan (in priority order)
1. **Wire the capture screen to Firestore.** Replace mock SESSIONS/ATHLETES/METRICS with live reads (sessions filtered to scoring==true). Real `saveEvaluation` via addDoc to `evaluations`, including `uid` (auth) + `evaluatorId` + createdAt/updatedAt/deleted. Google sign-in; map auth user to an evaluator. (Unblocks data capture; her #1.)
2. **Create the evaluators collection** (6 coaches, authUid mapping, isHeadCoach). Resolve current evaluator from auth on app load.
3. **Scoring engine** (her #1 and #2): normalization + per-position weights (section 7) + culture override + multi-evaluator aggregation. Keep weights in an editable config (not hardcoded).
4. **Per-athlete reference scorecard**: profile view of all metric areas with strengths/gaps, aggregated across evaluators, plus that athlete's notes. (Explicitly requested.)
5. **Ranked board**: per-position ranked list (starting point, adjustable), V/JV/JV2 cut lines using the roster counts in section 6 (only 4 open varsity spots), with override controls.
6. **Attendance + eligibility gates**: track the 3 tryout days; flag athletes missing any day or academically ineligible; exclude from roster eligibility.
7. **Roster builder + letter generation**: set teams in-app, generate acceptance and cut letters (printable/email), designed for discreet end-of-day handout.
8. **End-of-day athlete status** (dailyStatus map): strong contender / needs improvement, printable slip per athlete per day.
9. **Post-tryout intake**: jersey size and similar for athletes who make a team.
10. **JV/JV2 scoring profile** (potential/athleticism weighting).
11. **Polish**: Firestore composite indexes, courtside error/offline resilience, fast athlete lookup.
Do NOT build: parent-facing defensible reports (lowest priority), mid-season call-up flagging (she said no).

## 10. Guardrails
- Never commit `serviceAccountKey.json` or any athlete CSV (minors' PII; repo is public). Admin SDK scripts run locally only.
- Every evaluation write must include `uid == auth.uid` or security rules reject it.
- Capture raw reps; defer all averaging/weighting to the scoring layer.
- Keep notes and evaluations top-level and keyed by athleteId so both apps stay interoperable.
