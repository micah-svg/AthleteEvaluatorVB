/**
 * One-time migration: add the new athlete-profile fields surfaced by the
 * coach questionnaire to the 74 already-imported athlete docs.
 * Same folder / same serviceAccountKey.json. Run: node update_athletes.js
 *
 * Adds (only if missing, so it is safe to re-run):
 *   attendance        map of the 3 tryout days, null = not yet recorded
 *   jerseySize        blank, captured post-tryout from athletes who make a team
 *   eligibilityStatus default "pending" (eligible / ineligible_grades / pending)
 *   status            default "active" (active / withdrawn / injured / cut)
 *   dailyStatus       map for end-of-day standing (strong_contender / needs_improvement)
 */

const admin = require("firebase-admin");
const KEY_FILE = "./serviceAccountKey.json";

admin.initializeApp({ credential: admin.credential.cert(require(KEY_FILE)) });
const db = admin.firestore();

const DEFAULTS = {
  attendance: { "tryout-day-1": null, "tryout-day-2": null, "tryout-day-3": null },
  jerseySize: "",
  eligibilityStatus: "pending",
  status: "active",
  dailyStatus: { "tryout-day-1": null, "tryout-day-2": null, "tryout-day-3": null },
};

async function run() {
  const snap = await db.collection("athletes").get();
  let batch = db.batch();
  let touched = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};
    for (const [field, def] of Object.entries(DEFAULTS)) {
      // only fill fields that are missing or null, never overwrite real values
      if (data[field] === undefined || data[field] === null) {
        updates[field] = def;
      }
    }
    if (Object.keys(updates).length > 0) {
      batch.set(doc.ref, updates, { merge: true });
      touched++;
    }
  }

  await batch.commit();
  console.log(`Updated ${touched} of ${snap.size} athlete docs with new fields.`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
