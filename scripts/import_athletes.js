/**
 * Import Bruins VB athlete profiles into Firestore.
 *
 * Setup:
 *   1. Place serviceAccountKey.json (from Firebase console > Project settings
 *      > Service accounts > Generate new private key) in this folder.
 *   2. Place bruins_vb_athlete_profiles.csv in this folder.
 *   3. npm install firebase-admin csv-parse
 *   4. node import_athletes.js
 */

const fs = require("fs");
const admin = require("firebase-admin");
const { parse } = require("csv-parse/sync");

// ---- config ----
const CSV_FILE = "bruins_vb_athlete_profiles.csv";
const COLLECTION = "athletes"; // change if you want a different collection name
const KEY_FILE = "./serviceAccountKey.json";

// fields that should be stored as numbers
const NUMERIC = new Set(["gradeNumeric", "experienceYearsApprox", "tryoutNumber", "heightInches"]);
// fields that should be stored as booleans
const BOOLEAN = new Set(["isReturning"]);
// fields that should be parsed from a JSON array string
const ARRAY = new Set(["positionsInterested"]);

admin.initializeApp({
  credential: admin.credential.cert(require(KEY_FILE)),
});
const db = admin.firestore();

function coerce(field, value) {
  const v = (value ?? "").trim();
  if (v === "") return null; // store empty cells as null so fields stay queryable
  if (NUMERIC.has(field)) {
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  }
  if (BOOLEAN.has(field)) return v.toUpperCase() === "TRUE";
  if (ARRAY.has(field)) {
    try {
      return JSON.parse(v);
    } catch {
      return [];
    }
  }
  return v;
}

async function run() {
  const raw = fs.readFileSync(CSV_FILE, "utf8");
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  let batch = db.batch();
  let inBatch = 0;
  let total = 0;

  for (const row of records) {
    const docId = (row.athleteId || "").trim();
    if (!docId) {
      console.warn("Skipping row with no athleteId:", row.fullName);
      continue;
    }
    const data = {};
    for (const [field, value] of Object.entries(row)) {
      data[field] = coerce(field, value);
    }
    batch.set(db.collection(COLLECTION).doc(docId), data, { merge: true });
    inBatch++;
    total++;

    // Firestore allows max 500 writes per batch
    if (inBatch === 500) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }

  if (inBatch > 0) await batch.commit();
  console.log(`Imported ${total} athletes into "${COLLECTION}".`);
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
