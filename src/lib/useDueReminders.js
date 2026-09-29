import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from './supabase'
import { dueRows, summarizeDue } from './lesionView'
import { useIntervalWeeks } from './interval'
import { todayYMD } from './date'
import { subscribeDueChanged } from './dueSignal'

const NOTHING_DUE = { overdue: 0, soon: 0, ready: true }

// Liczba zaległych i „wkrótce" (w ciągu 30 dni) kontroli danej osoby — do
// znacznika przy „Kontrole" w nawigacji i lekkiego powiadomienia.
//
// Kiedy liczymy ponownie:
//  - zmiana osoby lub interwału,
//  - `notifyDueChanged()` (ktoś zmienił status / dodał / usunął znamię lub zdjęcie),
//  - zmiana ekranu — naturalny moment, w którym znacznik znów jest istotny,
//  - powrót do aplikacji (karta znów widoczna).
//
// Ostatnie dwa punkty są siatką bezpieczeństwa: nawet gdyby jakieś miejsce
// zapisu zapomniało zawołać `notifyDueChanged()`, znacznik nie zostanie
// ze starą liczbą na dłużej.
export function useDueReminders(personId) {
  const [intervalWeeks] = useIntervalWeeks(personId)
  const [counts, setCounts] = useState({ overdue: 0, soon: 0, ready: false })
  const { pathname } = useLocation()
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => subscribeDueChanged(refresh), [refresh])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  useEffect(() => {
    let active = true

    if (!personId) {
      setCounts(NOTHING_DUE)
      return undefined
    }

    supabase
      .from('lesions')
      .select('*, lesion_photos(taken_at, size_mm)')
      .eq('person_id', personId)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setCounts(NOTHING_DUE)
          return
        }
        const rows = dueRows(data || [], { intervalWeeks, today: todayYMD() })
        setCounts({ ...summarizeDue(rows), ready: true })
      })

    return () => {
      active = false
    }
  }, [personId, intervalWeeks, pathname, version])

  return counts
}
