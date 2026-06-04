/**
 * Fill authUid fields on evaluator docs after coaches have signed in.
 *
 * Two ways to use this:
 *
 *   1. AUTO — looks up each coach's UID from Firebase Auth by email.
 *      Just run: node update_evaluator_uids.js
 *      Works as long as the coach has signed in at least once.
 *
 *   2. MANUAL — if auto lookup fails for any coach (never signed in yet),
 *      paste their UID into the MANUAL_OVERRIDES map below and re-run.
 *      Find UIDs in Firebase Console → Authentication → Users.
 *
 * Safe to re-run: skips docs that already have a matching authUid.
 * NEVER commit serviceAccountKey.json.
 */

const admin = require("firebase-admin");
const KEY_FILE = "./serviceAccountKey.json";

admin.initializeApp({ credential: admin.credential.cert(require(KEY_FILE)) });
const db = admin.firestore();
const auth = admin.auth();

// Paste UIDs here for any coach whose auto-lookup fails (never signed in yet).
// Key = evaluatorId, value = UID string from Firebase Console.
const MANUAL_OVERRIDES = {
  // lihau:  "paste-uid-here",
  // micah:  "paste-uid-here",
  // mary:   "paste-uid-here",
  // tai:    "paste-uid-here",
  // josie:  "paste-uid-here",
  // kelsey: "paste-uid-here",
};

async function run() {
  const snap = await db.collection("evaluators").get();
  if (snap.empty) {
    console.error("No evaluator docs found. Run seed_evaluators.js first.");
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of snap.docs) {
    const ev = doc.data();
    const evaluatorId = doc.id;

    // Already has a UID — skip unless there's a manual override
    if (ev.authUid && !MANUAL_OVERRIDES[evaluatorId]) {
      console.log(`  [skip]    ${evaluatorId} — already set (${ev.authUid})`);
      skipped++;
      continue;
    }

    let uid = MANUAL_OVERRIDES[evaluatorId] || null;

    // Try auto-lookup from Firebase Auth if no manual override
    if (!uid && ev.email) {
      try {
        const userRecord = await auth.getUserByEmail(ev.email);
        uid = userRecord.uid;
      } catch (e) {
        if (e.code === "auth/user-not-found") {
          console.warn(`  [not found] ${evaluatorId} (${ev.email}) — not signed in yet. Add to MANUAL_OVERRIDES when available.`);
        } else {
          console.error(`  [error]   ${evaluatorId} (${ev.email}): ${e.message}`);
        }
        failed++;
        continue;
      }
    }

    if (!uid) {
      console.warn(`  [skip]    ${evaluatorId} — no email and no manual override`);
      skipped++;
      continue;
    }

    await doc.ref.update({ authUid: uid });
    console.log(`  [updated] ${evaluatorId} (${ev.name}) → ${uid}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}  Skipped: ${skipped}  Failed/missing: ${failed}`);
  if (failed > 0) {
    console.log("For coaches not yet signed in, paste their UID into MANUAL_OVERRIDES and re-run.");
  }
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
