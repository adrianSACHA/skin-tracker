import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DEFAULT_INTERVAL_WEEKS } from './settings'

const STORAGE_KEY = 'skin-tracker:interval-weeks'

// Domyślny interwał kontroli w tygodniach mieszka w `settings.js` (czystym,
// bez Supabase i Reacta), żeby mogły go używać także moduły w pełni
// testowalne. Re-eksport, żeby dotychczasowe importy działały.
export { DEFAULT_INTERVAL_WEEKS }

// Interwał trzymamy lokalnie (szybko, per urządzenie) ORAZ synchronizujemy do
// `monitored_persons.interval_weeks` — dzięki temu nadawca przypomnień Web Push
// (GitHub Actions) policzy termin po stronie serwera dla znamion bez
// ręcznego `next_check_at`.
export function useIntervalWeeks(personId) {
  const [weeks, setWeeks] = useState(() => {
    let parsed = NaN
    try {
      parsed = Number(localStorage.getItem(STORAGE_KEY))
    } catch {
      parsed = NaN
    }
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_WEEKS
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(weeks))
    } catch {
      /* brak localStorage - ignorujemy */
    }
  }, [weeks])

  useEffect(() => {
    if (!personId) return undefined
    let active = true
    supabase
      .from('monitored_persons')
      .update({ interval_weeks: weeks })
      .eq('id', personId)
      .then(() => {
        /* best-effort - brak tabeli/kolumny nie może psuć UI */
        return active
      })
    return () => {
      active = false
    }
  }, [personId, weeks])

  return [weeks, setWeeks]
}
