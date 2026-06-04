import { useAuth } from './hooks/useAuth'
import EvaluationCapture from './views/EvaluationCapture'

const C = { blue: '#1A3CA0', gold: '#FCB712', navy: '#14213E', cream: '#FAF6EB' }
const DISPLAY = "'Barlow Condensed', sans-serif"
const BODY = "'DM Sans', sans-serif"

export default function App() {
  const { user, ready, isStaff, signIn } = useAuth()

  if (!ready) return <Gate><p style={{ fontFamily: BODY, color: C.navy }}>Loading…</p></Gate>

  if (!user) return (
    <Gate>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 28, color: C.navy, textTransform: 'uppercase', marginBottom: 8 }}>
        BARLOW <span style={{ color: C.gold }}>EVAL</span>
      </div>
      <p style={{ fontFamily: BODY, fontSize: 14, color: '#7A7A7A', marginBottom: 24 }}>
        Sign in with your team Google account to begin scoring.
      </p>
      <button onClick={signIn} style={signInBtn}>Sign in with Google</button>
    </Gate>
  )

  if (!isStaff) return (
    <Gate>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 22, color: C.navy }}>
        Access Denied
      </div>
      <p style={{ fontFamily: BODY, fontSize: 14, color: '#7A7A7A', marginTop: 8 }}>
        {user.email} is not on the Barlow staff list.
      </p>
    </Gate>
  )

  return <EvaluationCapture />
}

function Gate({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#E9E6DC', padding: 20 }}>
      <div style={{ background: C.cream, borderRadius: 20, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.15)' }}>
        <div style={{ width: 46, height: 4, background: C.gold, borderRadius: 2, margin: '0 auto 16px' }} />
        {children}
      </div>
    </div>
  )
}

const signInBtn = {
  background: C.blue, color: '#fff', border: 'none', borderRadius: 14,
  padding: '14px 24px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 16,
  letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', width: '100%',
}
