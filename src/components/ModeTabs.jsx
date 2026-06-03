export default function ModeTabs({ mode, setMode, isEvaluator }) {
  const tabs = isEvaluator
    ? [['athlete', 'By Athlete'], ['trait', 'By Skill'], ['intangibles', 'Intangibles'], ['results', 'Results']]
    : [['results', 'Results']]
  return (
    <div className="seg">
      {tabs.map(([m, label]) => (
        <button key={m} className={m === mode ? 'on' : ''} onClick={() => setMode(m)}>
          {label}
        </button>
      ))}
    </div>
  )
}
