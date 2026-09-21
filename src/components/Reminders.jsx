import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import {
  addDaysYMD,
  addWeeksYMD,
  formatDate,
  todayYMD,
} from '../lib/date'
import { useIntervalWeeks } from '../lib/interval'
import { buildRows } from '../lib/lesionView'
import StatusBadge from './StatusBadge'
import CalendarReminderButton from './CalendarReminderButton'

const SOON_DAYS = 30 // horyzont "wkrótce" w pasku podsumowania

// Sekcja przesuwania terminu: wybierz liczbę tygodni, potem „Przesuń".
function SnoozeControl({ defaultWeeks, busy, onSnooze }) {
  const options = [...new Set([defaultWeeks, 1, 2, 3, 4, 6, 8, 12])]
    .filter((w) => w > 0)
    .sort((a, b) => a - b)
  const [weeks, setWeeks] = useState(defaultWeeks)

  return (
    <span className="inline-flex items-center">
      <select
        aria-label="Przesuń o ile tygodni"
        value={weeks}
        onChange={(e) => setWeeks(Number(e.target.value))}
        disabled={busy}
        className="min-h-[44px] rounded-l-lg border border-r-0 border-slate-300 bg-white px-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        {options.map((w) => (
          <option key={w} value={w}>
            {w} tyg.
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onSnooze(weeks)}
        disabled={busy}
        className="min-h-[44px] rounded-r-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Przesuń
      </button>
    </span>
  )
}

export default function Reminders() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const [intervalWeeks] = useIntervalWeeks()

  const [person, setPerson] = useState(null)
  const [lesions, setLesions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingLead, setSavingLead] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const [leadDays, setLeadDays] = useState(7)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [personRes, lesionsRes] = await Promise.all([
      supabase
        .from('monitored_persons')
        .select('*')
        .eq('id', personId)
        .maybeSingle(),
      supabase
        .from('lesions')
        .select('*, lesion_photos(taken_at, size_mm)')
        .eq('person_id', personId),
    ])

    if (personRes.error) setError(personRes.error.message)
    if (personRes.data) {
      setPerson(personRes.data)
      if (Number.isFinite(personRes.data.reminder_lead_days)) {
        setLeadDays(personRes.data.reminder_lead_days)
      }
    }
    setLesions(lesionsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  const rows = useMemo(() => {
    const built = buildRows(lesions, { intervalWeeks, today: todayYMD() })
    const mapped = built.map((row) => ({
      ...row,
      daysLeft: row.daysUntilNext,
      snoozed: Boolean(row.lesion.next_check_at),
      remindOn: addDaysYMD(row.next, -leadDays),
    }))
    // Najpilniejsze (najbardziej zaległe / najbliższe) na górze.
    return mapped.sort((a, b) => a.next.localeCompare(b.next))
  }, [lesions, intervalWeeks, leadDays])

  const summary = useMemo(() => {
    let overdue = 0
    let soon = 0
    for (const r of rows) {
      if (r.daysLeft === null) continue
      if (r.daysLeft < 0) overdue += 1
      else if (r.daysLeft <= SOON_DAYS) soon += 1
    }
    return { overdue, soon }
  }, [rows])

  const persistLeadDays = async () => {
    const value = Math.min(60, Math.max(0, Number(leadDays) || 0))
    setLeadDays(value)
    setSavingLead(true)
    const { error: updErr } = await supabase
      .from('monitored_persons')
      .update({ reminder_lead_days: value })
      .eq('id', personId)
    setSavingLead(false)
    if (updErr) {
      setError(
        `${updErr.message} — czy uruchomiłeś sekcję 7 z supabase/rls-setup.sql?`
      )
      return
    }
    setPerson((p) => (p ? { ...p, reminder_lead_days: value } : p))
    toast.success('Ustawienie zapisane')
  }

  const snooze = async (lesion, weeks) => {
    setBusyId(lesion.id)
    setError(null)
    const target = addWeeksYMD(todayYMD(), weeks)
    const { error: updErr } = await supabase
      .from('lesions')
      .update({ next_check_at: target })
      .eq('id', lesion.id)
    setBusyId(null)
    if (updErr) {
      setError(
        `${updErr.message} — czy uruchomiłeś sekcję 7 z supabase/rls-setup.sql?`
      )
      return
    }
    setLesions((prev) =>
      prev.map((l) => (l.id === lesion.id ? { ...l, next_check_at: target } : l))
    )
    toast.success(`Przesunięto na ${formatDate(target)}`)
  }

  const clearSnooze = async (lesion) => {
    setBusyId(lesion.id)
    setError(null)
    const { error: updErr } = await supabase
      .from('lesions')
      .update({ next_check_at: null })
      .eq('id', lesion.id)
    setBusyId(null)
    if (updErr) {
      setError(updErr.message)
      return
    }
    setLesions((prev) =>
      prev.map((l) => (l.id === lesion.id ? { ...l, next_check_at: null } : l))
    )
    toast.success('Przywrócono datę wyliczaną')
  }

  const addSession = (lesion) => {
    navigate(`/person/${personId}/lesion/${lesion.id}`, {
      state: { from: 'reminders', openUpload: true },
    })
  }

  const btnSecondary =
    'inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Kontrole{person ? ` — ${person.display_name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kiedy zaplanować kolejną kontrolę każdego znamienia i co wysłać do
          kalendarza.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {/* Ustawienia przypomnień */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <label htmlFor="lead-days">Przypomnij</label>
          <input
            id="lead-days"
            type="number"
            min="0"
            max="60"
            value={leadDays}
            onChange={(e) => setLeadDays(e.target.value)}
            onBlur={persistLeadDays}
            disabled={savingLead}
            className="min-h-[44px] w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <span>dni przed kontrolą</span>
        </div>

        <p className="text-slate-600 dark:text-slate-300">
          Interwał kontroli:{' '}
          <strong className="text-slate-800 dark:text-slate-100">
            co {intervalWeeks} tyg.
          </strong>{' '}
          <Link
            to={`/person/${personId}/list`}
            className="text-teal-700 hover:underline dark:text-teal-300"
          >
            (zmień na liście znamion)
          </Link>
        </p>
      </div>

      {/* Pasek podsumowania */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-950 dark:text-red-200">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          Zaległe: <strong>{summary.overdue}</strong>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
          <span
            className="h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400"
            aria-hidden="true"
          />
          W ciągu {SOON_DAYS} dni: <strong>{summary.soon}</strong>
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wczytywanie kontroli…
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Brak znamion. Dodaj je na mapie ciała, aby planować kontrole.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ lesion, last, next, daysLeft, overdue, snoozed, remindOn }) => (
            <li
              key={lesion.id}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/person/${personId}/lesion/${lesion.id}`}
                    state={{ from: 'reminders' }}
                    className="text-base font-semibold text-slate-800 hover:text-teal-700 hover:underline dark:text-slate-100 dark:hover:text-teal-300"
                  >
                    {lesion.label}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={lesion.status} />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Ostatnie zdjęcie: {formatDate(last)}
                    </span>
                    {snoozed ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        przesunięte
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-right text-sm">
                  <p
                    className={
                      overdue
                        ? 'font-semibold text-red-700 dark:text-red-300'
                        : 'font-semibold text-slate-800 dark:text-slate-100'
                    }
                  >
                    {overdue
                      ? `zaległe ${Math.abs(daysLeft)} dni`
                      : daysLeft === 0
                        ? 'dziś'
                        : `za ${daysLeft} dni`}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {formatDate(next)} · przypomnienie {formatDate(remindOn)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addSession(lesion)}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-teal-700 px-3 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  Dodaj zdjęcie
                </button>
                <SnoozeControl
                  defaultWeeks={intervalWeeks}
                  busy={busyId === lesion.id}
                  onSnooze={(weeks) => snooze(lesion, weeks)}
                />
                {snoozed ? (
                  <button
                    type="button"
                    onClick={() => clearSnooze(lesion)}
                    disabled={busyId === lesion.id}
                    className={btnSecondary}
                  >
                    Przywróć wyliczoną
                  </button>
                ) : null}
                <CalendarReminderButton
                  label={lesion.label}
                  lastDate={last}
                  intervalWeeks={intervalWeeks}
                  leadDays={leadDays}
                  startDate={next}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Daty są wyliczane z ostatniego zdjęcia + interwał (albo z ręcznie
        przesuniętej daty). To organizacja dokumentacji, nie ocena medyczna.
      </p>
    </div>
  )
}
