import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { buildRows, summarizeDue } from './lesionView'
import { useIntervalWeeks } from './interval'
import { todayYMD } from './date'

// Liczba zaległych i „wkrótce" (w ciągu 30 dni) kontroli danej osoby — do
// znacznika przy „Kontrole" w nawigacji i lekkiego powiadomienia.
export function useDueReminders(personId) {
  const [intervalWeeks] = useIntervalWeeks()
  const [counts, setCounts] = useState({ overdue: 0, soon: 0, ready: false })

  useEffect(() => {
    let active = true

    if (!personId) {
      setCounts({ overdue: 0, soon: 0, ready: true })
      return undefined
    }

    supabase
      .from('lesions')
      .select('*, lesion_photos(taken_at, size_mm)')
      .eq('person_id', personId)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setCounts({ overdue: 0, soon: 0, ready: true })
          return
        }
        const rows = buildRows(data || [], { intervalWeeks, today: todayYMD() })
        setCounts({ ...summarizeDue(rows), ready: true })
      })

    return () => {
      active = false
    }
  }, [personId, intervalWeeks])

  return counts
}
