import { useEffect, useState } from 'react'
import { watchRoster, watchMyEvals, watchWeek } from '../services/db'

export function useRoster(enabled) {
  const [roster, setRoster] = useState([])
  useEffect(() => {
    if (!enabled) return
    return watchRoster(setRoster)
  }, [enabled])
  return roster
}

export function useMyEvals(uid) {
  const [evals, setEvals] = useState({})
  useEffect(() => {
    if (!uid) return
    return watchMyEvals(uid, setEvals)
  }, [uid])
  return evals
}

export function useWeekData(week, enabled) {
  const [evals, setEvals] = useState([])
  const [subs, setSubs] = useState([])
  useEffect(() => {
    if (!enabled) return
    setEvals([]); setSubs([])
    return watchWeek(week, setEvals, setSubs)
  }, [week, enabled])
  return { evals, subs }
}
