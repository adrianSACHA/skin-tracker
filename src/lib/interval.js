import { useEffect, useState } from 'react'

const STORAGE_KEY = 'skin-tracker:interval-weeks'

// Domyślny interwał kontroli w tygodniach (edytowalny, zapamiętywany lokalnie).
export const DEFAULT_INTERVAL_WEEKS = 6

export function useIntervalWeeks() {
  const [weeks, setWeeks] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_WEEKS
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(weeks))
  }, [weeks])

  return [weeks, setWeeks]
}
