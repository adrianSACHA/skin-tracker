import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { DayPicker } from 'react-day-picker'
import { pl } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import {
  addWeeksYMD,
  daysSince,
  formatDate,
  todayYMD,
  toYMD,
} from '../lib/date'
import { STATUS_PRIORITY, statusMeta } from '../lib/status'
import { useIntervalWeeks } from '../lib/interval'
import StatusBadge from './StatusBadge'
import CalendarReminderButton from './CalendarReminderButton'

function lastPhotoDate(photos) {
  if (!photos || photos.length === 0) return null
  return photos.reduce(
    (max, p) => (max && max > p.taken_at ? max : p.taken_at),
    null
  )
}

export default function LesionsList() {
  const { personId } = useParams()
  const [lesions, setLesions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [onlyAttention, setOnlyAttention] = useState(false)
  const [intervalWeeks, setIntervalWeeks] = useIntervalWeeks()
  const [selectedDay, setSelectedDay] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: loadError } = await supabase
      .from('lesions')
      .select('*, lesion_photos(taken_at, size_mm)')
      .eq('person_id', personId)

    if (loadError) setError(loadError.message)
    else setLesions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  const rows = useMemo(() => {
    const mapped = lesions.map((lesion) => {
      const last = lastPhotoDate(lesion.lesion_photos)
      return {
        lesion,
        last,
        next: addWeeksYMD(last || todayYMD(), intervalWeeks),
        overdueDays: last ? daysSince(last) : null,
      }
    })

    const filtered = onlyAttention
      ? mapped.filter(
          ({ lesion }) =>
            lesion.status === 'watch' || lesion.status === 'urgent'
        )
      : mapped

    return filtered.sort((a, b) => {
      const pa = STATUS_PRIORITY[a.lesion.status] ?? 9
      const pb = STATUS_PRIORITY[b.lesion.status] ?? 9
      if (pa !== pb) return pa - pb
      // Dawniej kontrolowane (bardziej zaległe) na górze.
      const la = a.last || ''
      const lb = b.last || ''
      return la.localeCompare(lb)
    })
  }, [lesions, onlyAttention, intervalWeeks])

  // Przypomnienia per dzień (data ostatniej sesji + interwał) - dla kalendarza.
  const reminderMap = useMemo(() => {
    const map = new Map()
    for (const lesion of lesions) {
      const last = lastPhotoDate(lesion.lesion_photos)
      const next = addWeeksYMD(last || todayYMD(), intervalWeeks)
      const overdue = last ? daysSince(last) > intervalWeeks * 7 : false
      const arr = map.get(next) || []
      arr.push({ lesion, overdue })
      map.set(next, arr)
    }
    return map
  }, [lesions, intervalWeeks])

  const reminderDates = useMemo(
    () => [...reminderMap.keys()].map((ymd) => new Date(`${ymd}T00:00:00`)),
    [reminderMap]
  )

  const overdueDates = useMemo(
    () =>
      [...reminderMap.entries()]
        .filter(([, arr]) => arr.some((x) => x.overdue))
        .map(([ymd]) => new Date(`${ymd}T00:00:00`)),
    [reminderMap]
  )

  const selectedReminders = useMemo(() => {
    if (!selectedDay) return null
    return reminderMap.get(toYMD(selectedDay)) || []
  }, [selectedDay, reminderMap])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Lista znamion
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Statusy „Do obserwacji" i „Do pilnej konsultacji" oraz sugerowana
            data następnej kontroli.
          </p>
        </div>
        <Link
          to={`/person/${personId}`}
          className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
        >
          ← Mapa ciała
        </Link>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {/* Ustawienia */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyAttention}
            onChange={(e) => setOnlyAttention(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-600 dark:bg-slate-800"
          />
          Pokaż tylko „do obserwacji" i „do pilnej konsultacji"
        </label>

        <div className="flex items-center gap-2">
          <label htmlFor="interval-weeks-list">Interwał (tyg.)</label>
          <input
            id="interval-weeks-list"
            type="number"
            min="1"
            max="52"
            value={intervalWeeks}
            onChange={(e) =>
              setIntervalWeeks(Math.max(1, Number(e.target.value) || 1))
            }
            className="min-h-[40px] w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wczytywanie znamion…
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Brak znamion do wyświetlenia.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ lesion, last, next, overdueDays }) => {
            const overdue =
              overdueDays !== null && overdueDays > intervalWeeks * 7
            return (
              <li
                key={lesion.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/person/${personId}/lesion/${lesion.id}`}
                      className="text-base font-semibold text-slate-800 hover:text-teal-700 hover:underline dark:text-slate-100 dark:hover:text-teal-300"
                    >
                      {lesion.label}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={lesion.status} />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Ostatnia sesja: {formatDate(last)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Sugerowana następna kontrola:{' '}
                  <strong
                    className={
                      overdue
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-slate-800 dark:text-slate-100'
                    }
                  >
                    {formatDate(next)}
                  </strong>
                  {overdue ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                      zaległe
                    </span>
                  ) : null}
                </div>

                <CalendarReminderButton
                  label={lesion.label}
                  lastDate={last}
                  intervalWeeks={intervalWeeks}
                />
              </li>
            )
          })}
        </ul>
      )}

      {/* Kalendarz przypomnień (pkt 6) - obok listy na szerokich ekranach */}
      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="rdp-wrap rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={(d) => setSelectedDay(d || null)}
            locale={pl}
            weekStartsOn={1}
            defaultMonth={new Date()}
            modifiers={{ reminder: reminderDates, overdue: overdueDates }}
            modifiersClassNames={{
              reminder: 'rdp-reminder',
              overdue: 'rdp-overdue',
            }}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          {selectedDay ? (
            selectedReminders && selectedReminders.length > 0 ? (
              <ul className="space-y-2">
                {selectedReminders.map(({ lesion, overdue }) => (
                  <li
                    key={lesion.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <Link
                      to={`/person/${personId}/lesion/${lesion.id}`}
                      className="font-medium text-slate-800 hover:text-teal-700 hover:underline dark:text-slate-100 dark:hover:text-teal-300"
                    >
                      {lesion.label}
                    </Link>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={lesion.status} />
                      {overdue ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                          zaległe
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                Brak przypomnień na {formatDate(toYMD(selectedDay))}.
              </p>
            )
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Kliknij dzień z kropką, aby zobaczyć, których znamion dotyczy
              przypomnienie.
            </p>
          )}
        </div>

        <p className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-700 dark:bg-teal-400" />
            zaplanowana kontrola
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            zaległe
          </span>
        </p>
      </aside>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Kolory statusów to prywatna organizacja dokumentacji, nie ocena
        medyczna. W razie wątpliwości skonsultuj się z lekarzem.
      </p>
    </div>
  )
}
