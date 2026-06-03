import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { STAFF, HEAD_COACHES, evaluatorFor } from '../config/roles'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true) }), [])

  const email = (user?.email || '').toLowerCase()
  const ev = user ? evaluatorFor(email) : null

  const value = {
    user,
    ready,
    email,
    isStaff: !!user && STAFF.includes(email),
    isHead: !!user && HEAD_COACHES.includes(email),
    coachKey: ev?.key || null,
    coachName: ev?.name || user?.displayName || email,
    isEvaluator: !!ev,
    signIn: () => signInWithPopup(auth, googleProvider).catch((e) => alert(e.message)),
    signOut: () => fbSignOut(auth),
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
