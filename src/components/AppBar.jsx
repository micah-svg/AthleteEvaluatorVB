import { useAuth } from '../hooks/useAuth'

export default function AppBar() {
  const { user, coachName, isEvaluator, signIn, signOut } = useAuth()
  return (
    <div className="appbar">
      <span className="brand">Barlow <b>Evals</b></span>
      <span className="spacer" />
      {user && (
        <span className="who">{coachName}{isEvaluator ? '' : ' · view only'}</span>
      )}
      <button className="btn btn-gold" onClick={user ? signOut : signIn}>
        {user ? 'Sign out' : 'Sign in'}
      </button>
    </div>
  )
}
