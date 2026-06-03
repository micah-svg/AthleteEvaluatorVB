/**
 * Seed the Bruins VB `metrics` and `sessions` collections.
 * Same folder / same serviceAccountKey.json as the import script.
 * Run: node seed_collections.js
 *
 * Re-runnable: uses merge so it updates rather than duplicates.
 */

const admin = require("firebase-admin");
const KEY_FILE = "./serviceAccountKey.json";

admin.initializeApp({ credential: admin.credential.cert(require(KEY_FILE)) });
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();

// ---- METRICS (the capture catalog, from the app) ----
const metrics = [
  // Physical
  { metricKey: "approachTouch", label: "Approach Touch", category: "Physical",
    inputType: "inches", repBased: false, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { note: "Max reach in inches (9'6\" = 114)" } },
  { metricKey: "blockTouch", label: "Block Touch", category: "Physical",
    inputType: "inches", repBased: false, appliesTo: ["OH","OPP","MB","S"],
    scaleLegend: { note: "Standing block reach in inches" } },
  { metricKey: "proAgility", label: "Pro Agility", category: "Physical",
    inputType: "seconds", repBased: false, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { note: "Time in seconds, lower is faster" } },

  // Serving
  { metricKey: "serveRating", label: "Serve Rating", category: "Serving",
    inputType: "scale_0_3", repBased: true, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { 0: "Error", 1: "Free Ball", 2: "OOS Out", 3: "Ace / Overpass" } },

  // Passing (serve receive, separated from defensive dig)
  { metricKey: "serveReceiveRating", label: "Serve Receive Rating", category: "Passing",
    inputType: "scale_0_3", repBased: true, appliesTo: ["OH","L","DS","S"],
    scaleLegend: { 0: "Ace / Shank", 1: "1-Option", 2: "2-Option", 3: "Perfect" } },

  // Defense (dig, separated from serve receive)
  { metricKey: "defenseDig", label: "Defense / Dig", category: "Defense",
    inputType: "scale_0_2", repBased: true, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { 0: "Not converted", 1: "Kept alive", 2: "Converted to transition" } },

  // Hitting
  { metricKey: "transitionHitting", label: "Transition Hitting", category: "Hitting",
    inputType: "tally_KEIP", repBased: true, appliesTo: ["OH","OPP","MB"],
    scaleLegend: { K: "Kill", E: "Error", IP: "In Play" } },

  // Setting
  { metricKey: "oosSet", label: "Out-of-System Set", category: "Setting",
    inputType: "scale_0_2", repBased: true, appliesTo: ["S"],
    scaleLegend: { 0: "Off target", 1: "Hittable", 2: "On target" } },

  // Blocking (the gap we added)
  { metricKey: "blocking", label: "Blocking", category: "Blocking",
    inputType: "scale_0_2", repBased: true, appliesTo: ["MB","OPP","OH","S"],
    scaleLegend: { 0: "Missed / Error", 1: "Touch / Slowed", 2: "Stuff block" } },

  // Intangibles (subjective, single observed rating per session)
  { metricKey: "compete", label: "Compete Level", category: "Intangibles",
    inputType: "scale_1_5", repBased: false, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { 1: "Low", 5: "High" } },
  { metricKey: "volleyballIQ", label: "Volleyball IQ", category: "Intangibles",
    inputType: "scale_1_5", repBased: false, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { 1: "Low", 5: "High" } },
  { metricKey: "communication", label: "Communication", category: "Intangibles",
    inputType: "scale_1_5", repBased: false, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { 1: "Low", 5: "High" } },
  { metricKey: "coachability", label: "Coachability", category: "Intangibles",
    inputType: "scale_1_5", repBased: false, appliesTo: ["S","OH","OPP","MB","L","DS"],
    scaleLegend: { 1: "Low", 5: "High" } },
];

// ---- SESSIONS (from the Elite Camp schedule + tryout placeholders) ----
const sessions = [
  { sessionId: "physical-testing", name: "Physical Testing & Check-In", type: "physical",
    date: "", focusMetrics: ["approachTouch","blockTouch","proAgility"] },
  { sessionId: "camp-day-1", name: "Elite Camp Day 1 - Ball Control & Serving", type: "camp",
    date: "", focusMetrics: ["serveRating","serveReceiveRating","defenseDig"] },
  { sessionId: "camp-day-2", name: "Elite Camp Day 2 - Setting & Hitting", type: "camp",
    date: "", focusMetrics: ["oosSet","transitionHitting","blocking"] },
  { sessionId: "camp-day-3", name: "Elite Camp Day 3 - Team Day", type: "camp",
    date: "", focusMetrics: ["compete","volleyballIQ","communication","coachability"] },
  { sessionId: "tryout-1", name: "Tryout Day 1", type: "tryout", date: "", focusMetrics: [] },
  { sessionId: "tryout-2", name: "Tryout Day 2", type: "tryout", date: "", focusMetrics: [] },
];

async function run() {
  let batch = db.batch();
  for (const m of metrics) {
    batch.set(db.collection("metrics").doc(m.metricKey), { ...m, createdAt: now }, { merge: true });
  }
  for (const s of sessions) {
    batch.set(db.collection("sessions").doc(s.sessionId), { ...s, createdAt: now }, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${metrics.length} metrics and ${sessions.length} sessions.`);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
