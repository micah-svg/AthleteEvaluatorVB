/**
 * Seed the Bruins VB `evaluators` collection.
 * Run: node seed_evaluators.js
 *
 * Re-runnable: uses merge so it updates rather than duplicates.
 *
 * After running, update the authUid field for each coach:
 *   node seed_evaluators.js  (initial seed with empty authUid)
 *   Then manually set authUid via Firebase console or update_evaluators.js
 *   once each coach has signed in and you have their UID from Firebase Auth.
 *
 * NEVER commit serviceAccountKey.json.
 */

const admin = require("firebase-admin");
const KEY_FILE = "./serviceAccountKey.json";

admin.initializeApp({ credential: admin.credential.cert(require(KEY_FILE)) });
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();

// Matches src/config/roles.js — 5 scoring evaluators + Kelsey (view-only staff)
const evaluators = [
  {
    evaluatorId: "lihau",
    name: "Lihau Perreira",
    email: "barlowbruins.volleyball@gmail.com",
    role: "Head Coach — Varsity",
    isHeadCoach: true,
    active: true,
    authUid: "", // fill after first sign-in
  },
  {
    evaluatorId: "micah",
    name: "Micah Wilson",
    email: "micahmariewilson@gmail.com",
    role: "Head Coach — JV",
    isHeadCoach: true,
    active: true,
    authUid: "",
  },
  {
    evaluatorId: "mary",
    name: "Mary Bredenkamp",
    email: "mary.bredenkamp2015@gmail.com",
    role: "Head Coach — JV2",
    isHeadCoach: true,
    active: true,
    authUid: "",
  },
  {
    evaluatorId: "tai",
    name: "Tai Quirke",
    email: "quirke2@gresham.k12.or.us",
    role: "Varsity Assistant",
    isHeadCoach: false,
    active: true,
    authUid: "",
  },
  {
    evaluatorId: "josie",
    name: "Josie Quirken",
    email: "josiejansen11@gmail.com",
    role: "Varsity Assistant",
    isHeadCoach: false,
    active: true,
    authUid: "",
  },
  {
    evaluatorId: "kelsey",
    name: "Kelsey Schreiber",
    email: "kelsey.merritt.ghs@gmail.com",
    role: "Volunteer Varsity Assistant",
    isHeadCoach: false,
    active: true,
    authUid: "",
    viewOnly: true, // scores not counted in aggregation
  },
];

async function run() {
  const batch = db.batch();
  for (const ev of evaluators) {
    batch.set(
      db.collection("evaluators").doc(ev.evaluatorId),
      { ...ev, createdAt: now },
      { merge: true }
    );
  }
  await batch.commit();
  console.log(`Seeded ${evaluators.length} evaluators.`);
  console.log("\nNext step: collect each coach's authUid after first sign-in.");
  console.log("Firebase console: Authentication > Users > copy UID column.");
  console.log("Then run update_evaluators.js (or set manually) to fill authUid fields.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
