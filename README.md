# Barlow Volleyball — Athlete Evaluations (React)

Vite + React (JavaScript) + Firebase. Same `barlowvball26` Firebase project as the
HTML version, so the data and rules carry over.

## Run it
```bash
npm install
npm run dev          # http://localhost:5173
```
Build for production:
```bash
npm run build        # outputs to dist/
```

## Deploy (Netlify)
Connect the repo, or drag the `dist/` folder. `netlify.toml` sets the build command
and the SPA redirect. After deploying, add the Netlify domain under
Firebase Auth → Settings → Authorized domains, and make sure Google sign-in is
enabled (Auth → Sign-in method → Google).

## Firestore rules
Use the field-agnostic rules from the project chat. The submit/freeze workflow also
needs the `submissions` rule:
```
match /submissions/{id} {
  allow read: if staff();
  allow create, update, delete: if staff() && request.resource.data.uid == request.auth.uid;
}
```

## Structure
```
src/
  firebase.js            Firebase init (auth, db, googleProvider)
  config/
    roles.js             STAFF, HEAD_COACHES, EVALUATORS, weightFor()  ← the weighting engine
    metrics.js           INTANGIBLES (1-3), SKILLS, norm(), roster helpers
  lib/
    aggregate.js         weighted per-athlete aggregation across coaches
  services/
    db.js                Firestore reads (watch*) and writes (save*, submission)
  hooks/
    useAuth.jsx          auth context: user, role flags, signIn/signOut
    useData.js           useRoster / useMyEvals / useWeekData
  components/
    AppBar.jsx, ModeTabs.jsx
  views/
    AthleteView.jsx      full skill entry for one athlete
    TraitView.jsx        one skill across the whole roster (auto-save)
    IntangiblesView.jsx  1-3 table across the whole roster (auto-save)
    ResultsView.jsx      grouped, sorted, weighted results + freeze + trends
  App.jsx                shell: auth gate, selection state, view routing
  main.jsx               entry
```

## Where to change things
- Weights: `src/config/roles.js` → `weightFor()`.
- Metrics (add/rename/rescale): `src/config/metrics.js`.
- Normalization for the Overall score: `norm()` in `metrics.js`.
- Aggregation math (thresholds use `SHOW_THRESHOLD`, freeze uses `EVAL_TOTAL`): `src/lib/aggregate.js` + `roles.js`.

## Notes / open items
- The "submit" workflow is explicit (each coach taps Submit my Week). 3 submitted
  shows aggregates; 5 submitted freezes the week.
- Consider adding `react-router` if you want shareable per-week result URLs.
- Consider moving the Firebase config to `.env` (VITE_*) if you prefer.
