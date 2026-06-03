import { INTANGIBLES } from '../config/metrics'
import { saveBank } from '../services/db'

export default function IntangiblesView({ roster, myEvals, week, user, coachKey, locked }) {
  function cycle(player, m, current) {
    if (locked) return
    const next = current >= 5 ? null : (current || 0) + 1
    saveBank({ player, week, user, coachKey, bank: 'intangible', key: m.key, value: next })
  }

  return (
    <div>
      <div className="legend">
        <b>1</b> Poor/Passive &nbsp;
        <b>3</b> Average Varsity &nbsp;
        <b>5</b> Elite/All-State &nbsp;·&nbsp;
        tap a cell to cycle (1→5). Week {week}. {locked ? 'Locked.' : 'Saves on each tap.'}
      </div>
      <div className="tablewrap">
        <table className="intab">
          <thead>
            <tr>
              <th className="nameC">Athlete</th>
              {INTANGIBLES.map((m) => <th key={m.key} title={m.label}>{m.short}</th>)}
            </tr>
          </thead>
          <tbody>
            {roster.map((p) => {
              const rec = myEvals[`${p.id}__w${week}`]
              return (
                <tr key={p.id}>
                  <td className="nameC">
                    <div className="pn">{p.name}</div>
                    <div className="pmeta">{p.grade} · {p.position}</div>
                  </td>
                  {INTANGIBLES.map((m) => {
                    const v = rec?.intangible?.[m.key] ?? null
                    return (
                      <td key={m.key}>
                        <button className={`cell ${v ? 'v' + v : ''}`} onClick={() => cycle(p, m, v)}>
                          {v || '–'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
