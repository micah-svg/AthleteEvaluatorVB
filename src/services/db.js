import {
  collection, doc, setDoc, addDoc, deleteDoc, onSnapshot,
  query, where, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ---- subscriptions (return an unsubscribe fn) ----
export function watchRoster(cb) {
  return onSnapshot(collection(db, 'roster'), (snap) => {
    const r = []
    snap.forEach((d) => {
      const v = d.data()
      r.push({
        id: d.id,
        name: v.name || d.id,
        grade: v.grade || '',
        position: (v.position || v.pos || '').toUpperCase(),
        gpa: v.gpa ?? null,
        returning: !!v.returning,
      })
    })
    r.sort((a, b) => a.name.localeCompare(b.name))
    cb(r)
  })
}

export function watchMyEvals(uid, cb) {
  return onSnapshot(query(collection(db, 'evaluations'), where('uid', '==', uid)), (snap) => {
    const m = {}
    snap.forEach((d) => { const v = d.data(); m[`${v.playerId}__w${v.week}`] = v })
    cb(m)
  })
}

export function watchWeek(week, onEvals, onSubs) {
  const u1 = onSnapshot(query(collection(db, 'evaluations'), where('week', '==', week)), (s) => {
    const a = []; s.forEach((d) => a.push(d.data())); onEvals(a)
  })
  const u2 = onSnapshot(query(collection(db, 'submissions'), where('week', '==', week)), (s) => {
    const a = []; s.forEach((d) => a.push(d.data())); onSubs(a)
  })
  return () => { u1(); u2() }
}

export async function fetchWeek(week) {
  const ev = await getDocs(query(collection(db, 'evaluations'), where('week', '==', week)))
  const su = await getDocs(query(collection(db, 'submissions'), where('week', '==', week)))
  return { evals: ev.docs.map((d) => d.data()), subs: su.docs.map((d) => d.data()) }
}

// ---- writes ----
function identity(player, week, user, coachKey) {
  return {
    playerId: player.id,
    playerName: player.name || '',
    grade: player.grade || '',
    position: player.position || '',
    week,
    uid: user.uid,
    coachKey,
    coachEmail: (user.email || '').toLowerCase(),
    coach: user.displayName || user.email || '',
  }
}

// Save a single metric (used by Trait + Intangibles auto-save).
export async function saveBank({ player, week, user, coachKey, bank, key, value }) {
  const id = `${player.id}__w${week}__${user.uid}`
  const patch = { ...identity(player, week, user, coachKey), [bank]: { [key]: value }, ts: serverTimestamp() }
  await setDoc(doc(db, 'evaluations', id), patch, { merge: true })
}

// Save the full skill map for one athlete (By Athlete view).
export async function saveSkills({ player, week, user, coachKey, skill }) {
  const id = `${player.id}__w${week}__${user.uid}`
  const patch = { ...identity(player, week, user, coachKey), skill, ts: serverTimestamp() }
  await setDoc(doc(db, 'evaluations', id), patch, { merge: true })
}

export async function addPlayer(p, byEmail) {
  await addDoc(collection(db, 'roster'), { ...p, addedBy: byEmail || '', ts: serverTimestamp() })
}

export async function setSubmission({ week, user, coachKey }) {
  await setDoc(doc(db, 'submissions', `w${week}__${user.uid}`), {
    week, uid: user.uid, coachKey, email: (user.email || '').toLowerCase(), ts: serverTimestamp(),
  })
}

export async function clearSubmission({ week, user }) {
  await deleteDoc(doc(db, 'submissions', `w${week}__${user.uid}`))
}
