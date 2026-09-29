import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { notifyDueChanged } from '../lib/dueSignal'
import {
  addDaysYMD,
  addWeeksYMD,
  formatDate,
  todayYMD,
} from '../lib/date'
import { useIntervalWeeks } from '../lib/interval'
import { dueRows, filterByQuery } from '../lib/lesionView'
import { readListParams, buildListParams } from '../lib/listParams'
import {
  isNotifyOnOpenEnabled,
  notificationsSupported,
  requestNotificationPermission,
  setNotifyOnOpenEnabled,
} from '../lib/reminderNotify'
import {
  disablePush,
  enablePush,
  getPushSubscription,
  pushConfigured,
} from '../lib/push'
import { isStandalone, useInstallPrompt } from '../lib/install'
import StatusBadge from './StatusBadge'
import LesionName from './LesionName'
import CalendarReminderButton from './CalendarReminderButton'
import OverflowMenu from './OverflowMenu'

const SOON_DAYS = 30 // horyzont "wkrótce" w pasku podsumowania

export default function Reminders() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const [intervalWeeks] = useIntervalWeeks(personId)
  // Szukanie trzymamy w adresie (jak na liście znamion), więc przeżywa
  // odświeżenie i działa „wstecz”.
  const [searchParams, setSearchParams] = useSearchParams()
  const { q: query } = useMemo(
    () => readListParams(searchParams),
    [searchParams]
  )

  const [person, setPerson] = useState(null)
  const [lesions, setLesions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingLead, setSavingLead] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [searchInput, setSearchInput] = useState(
    () => (searchParams.get('q') || '').trim()
  )

  const [leadDays, setLeadDays] = useState(7)
  const [notifyOnOpen, setNotifyOnOpen] = useState(() =>
    isNotifyOnOpenEnabled()
  )
  const [pushOn, setPushOn] = useState(false)
  const [installed] = useState(() => isStandalone())
  const [permGranted, setPermGranted] = useState(
    () => notificationsSupported() && Notification.permission === 'granted'
  )
  const { canInstall, promptInstall } = useInstallPrompt()
  const [showFullPanel, setShowFullPanel] = useState(false)
  const notificationsReady = installed && permGranted && pushOn

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
        .select('*, lesion_photos(taken_at, size_mm), body_maps(view_name)')
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

  // Czy push w tle jest już włączony na tym urządzeniu?
  useEffect(() => {
    let active = true
    getPushSubscription().then((sub) => {
      if (active) setPushOn(Boolean(sub))
    })
    return () => {
      active = false
    }
  }, [])

  const rows = useMemo(() => {
    // Bez znamion „Usunięte” - nie ma czego kontrolować ani o czym przypominać.
    const built = dueRows(lesions, { intervalWeeks, today: todayYMD() })
    const mapped = built.map((row) => ({
      ...row,
      daysLeft: row.daysUntilNext,
      snoozed: Boolean(row.lesion.next_check_at),
      remindOn: addDaysYMD(row.next, -leadDays),
    }))
    // Najpilniejsze (najbardziej zaległe / najbliższe) na górze.
    return mapped.sort((a, b) => a.next.localeCompare(b.next))
  }, [lesions, intervalWeeks, leadDays])

  // Szukanie po nazwie znamienia albo okolicy (ta sama funkcja co lista).
  const visibleRows = useMemo(() => filterByQuery(rows, query), [rows, query])

  // Pole podąża za adresem (np. „wstecz”), ale nie nadpisuje tego, co
  // właśnie wpisujesz — porównujemy po przycięciu.
  useEffect(() => {
    setSearchInput((prev) => (prev.trim() === query ? prev : query))
  }, [query])

  const changeQuery = (value) => {
    setSearchInput(value)
    // Ten ekran używa wyłącznie `q` — nie ma tu filtra statusu ani sortowania.
    setSearchParams(buildListParams({ q: value }), { replace: true })
  }

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

  // Tygodnie do „Przesuń" (menu ⋯) — interwał domyślny + typowe wartości.
  const snoozeWeeks = useMemo(
    () =>
      [...new Set([intervalWeeks, 1, 2, 3, 4, 6, 8, 12])]
        .filter((w) => w > 0)
        .sort((a, b) => a - b),
    [intervalWeeks]
  )

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

  const toggleNotifyOnOpen = async (e) => {
    const on = e.target.checked
    if (!on) {
      setNotifyOnOpenEnabled(false)
      setNotifyOnOpen(false)
      return
    }
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      setNotifyOnOpenEnabled(false)
      setNotifyOnOpen(false)
      toast.error(
        permission === 'unsupported'
          ? 'Ta przeglądarka nie wspiera powiadomień.'
          : 'Brak zgody na powiadomienia — włącz je w ustawieniach przeglądarki.'
      )
      return
    }
    setNotifyOnOpenEnabled(true)
    setNotifyOnOpen(true)
    toast.success('Włączono powiadomienie przy otwarciu')
  }

  const applyPush = async (on) => {
    if (!on) {
      setPushOn(false)
      await disablePush()
      toast.success('Wyłączono powiadomienia w tle')
      return
    }
    const result = await enablePush()
    if (result !== 'granted') {
      setPushOn(false)
      toast.error(
        result === 'unsupported'
          ? 'Ta przeglądarka nie wspiera powiadomień w tle.'
          : result === 'unconfigured'
            ? 'Powiadomienia nie są skonfigurowane (brak klucza VAPID).'
            : 'Brak zgody na powiadomienia.'
      )
      return
    }
    setPushOn(true)
    setPermGranted(true)
    toast.success('Włączono powiadomienia w tle')
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
    notifyDueChanged()
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
    notifyDueChanged()
  }

  const addSession = (lesion) => {
    navigate(`/person/${personId}/lesion/${lesion.id}`, {
      state: { from: 'reminders', openUpload: true },
    })
  }

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

      {/* Onboarding: co zrobić, aby dostawać przypomnienia na telefon.
          Domyślnie ZWINIĘTY do jednej linii — pełna instrukcja zajmowała 297 px
          i spychała listę kontroli poniżej linii zgięcia. Cała linia jest
          przyciskiem, więc rozwinięcie to jedno dotknięcie. */}
      {!showFullPanel ? (
        <button
          type="button"
          onClick={() => setShowFullPanel(true)}
          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2 text-left text-sm dark:border-teal-800 dark:bg-teal-950/20"
        >
          <span className="inline-flex items-center gap-2 font-medium text-teal-900 dark:text-teal-100">
            <span
              aria-hidden="true"
              className={
                notificationsReady
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-400 dark:text-slate-500'
              }
            >
              {notificationsReady ? '✓' : '○'}
            </span>
            {notificationsReady
              ? 'Powiadomienia w tle: włączone'
              : 'Powiadomienia w tle: jeszcze nieaktywne'}
          </span>
          <span className="font-medium text-teal-800 underline dark:text-teal-200">
            {notificationsReady ? 'Szczegóły' : 'Skonfiguruj'}
          </span>
        </button>
      ) : (
      <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-sm dark:border-teal-800 dark:bg-teal-950/20">
        <div>
          <h2 className="font-semibold text-teal-900 dark:text-teal-100">
            Przypomnienia na telefon
          </h2>
          <p className="mt-1 text-teal-800/80 dark:text-teal-200/80">
            Aby dostawać powiadomienia w tle (nawet gdy aplikacja jest zamknięta),
            spełnij wszystkie trzy warunki. Bez nich zadziałają tylko
            przypomnienia zapisane w kalendarzu („Do kalendarza").
          </p>
        </div>

        <ul className="space-y-2">
          <li className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className={
                installed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-400 dark:text-slate-500'
              }
            >
              {installed ? '✓' : '○'}
            </span>
            <span className="flex-1 text-teal-900 dark:text-teal-100">
              Aplikacja zainstalowana na telefonie
            </span>
            {!installed && canInstall ? (
              <button
                type="button"
                onClick={promptInstall}
                className="min-h-[44px] rounded-lg border border-teal-300 bg-white px-3 font-medium text-teal-800 transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-teal-700 dark:bg-slate-900 dark:text-teal-200 dark:hover:bg-teal-950/40"
              >
                Zainstaluj
              </button>
            ) : null}
          </li>

          <li className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className={
                permGranted
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-400 dark:text-slate-500'
              }
            >
              {permGranted ? '✓' : '○'}
            </span>
            <span className="flex-1 text-teal-900 dark:text-teal-100">
              Zgoda na powiadomienia w przeglądarce
            </span>
          </li>

          <li className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className={
                pushOn
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-400 dark:text-slate-500'
              }
            >
              {pushOn ? '✓' : '○'}
            </span>
            <span className="flex-1 text-teal-900 dark:text-teal-100">
              Powiadomienia w tle włączone
            </span>
            {pushConfigured() ? (
              <button
                type="button"
                onClick={() => applyPush(!pushOn)}
                className="min-h-[44px] rounded-lg bg-teal-700 px-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                {pushOn ? 'Wyłącz' : 'Włącz'}
              </button>
            ) : null}
          </li>
        </ul>

        {!pushConfigured() ? (
          <p className="text-teal-800/80 dark:text-teal-200/80">
            Ten build nie ma skonfigurowanych powiadomień w tle (brak klucza
            VAPID).
          </p>
        ) : installed && permGranted && pushOn ? (
          <p className="font-medium text-teal-900 dark:text-teal-100">
            Wszystko gotowe — przypomnienia będą przychodzić same.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setShowFullPanel(false)}
          className="min-h-[44px] rounded-md px-1 font-medium text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-200"
        >
          Ukryj
        </button>
      </div>
      )}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {/* Pasek podsumowania — kolor = sygnał; zero przyjmuje neutralny wygląd.
          Liczby są CAŁKOWITE (niezależne od szukania), żeby zgadzały się ze
          znacznikiem przy „Kontrole” w nagłówku. */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span
          className={[
            'inline-flex items-center gap-2 rounded-full px-3 py-1',
            summary.overdue > 0
              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          ].join(' ')}
        >
          <span
            className={[
              'h-2 w-2 rounded-full',
              summary.overdue > 0
                ? 'bg-red-500'
                : 'bg-slate-400 dark:bg-slate-500',
            ].join(' ')}
            aria-hidden="true"
          />
          Zaległe: <strong>{summary.overdue}</strong>
        </span>
        <span
          className={[
            'inline-flex items-center gap-2 rounded-full px-3 py-1',
            summary.soon > 0
              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          ].join(' ')}
        >
          <span
            className={[
              'h-2 w-2 rounded-full',
              summary.soon > 0
                ? 'bg-teal-600 dark:bg-teal-400'
                : 'bg-slate-400 dark:bg-slate-500',
            ].join(' ')}
            aria-hidden="true"
          />
          W ciągu {SOON_DAYS} dni: <strong>{summary.soon}</strong>
        </span>
      </div>

      {!loading && rows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Szukaj po nazwie lub okolicy…"
            aria-label="Szukaj kontroli"
            className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {visibleRows.length} z {rows.length}
          </span>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wczytywanie kontroli…
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Brak znamion. Dodaj je na mapie ciała, aby planować kontrole.
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Brak kontroli dla podanego szukania.
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleRows.map(({ lesion, last, next, daysLeft, overdue, snoozed, remindOn }) => (
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
                    <LesionName
                      label={lesion.label}
                      viewName={lesion.body_maps?.view_name}
                      areaClassName="font-normal text-slate-400 dark:text-slate-500"
                    />
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={lesion.status} />
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Ostatnie zdjęcie: {formatDate(last)}
                    </span>
                    {snoozed ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        data ręcznie przesunięta
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addSession(lesion)}
                  disabled={busyId === lesion.id}
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-teal-700 px-3 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  Dodaj zdjęcie
                </button>
                <CalendarReminderButton
                  label={lesion.label}
                  lastDate={last}
                  intervalWeeks={intervalWeeks}
                  leadDays={leadDays}
                  startDate={next}
                />
                <OverflowMenu
                  label="Więcej akcji kontroli"
                  items={[
                    ...snoozeWeeks.map((w) => ({
                      key: `snooze-${w}`,
                      label: `Przesuń o ${w} tyg.`,
                      onSelect: () => snooze(lesion, w),
                    })),
                    ...(snoozed
                      ? [
                          { key: 'sep', separator: true },
                          {
                            key: 'clear-snooze',
                            label: 'Przywróć wyliczoną datę',
                            onSelect: () => clearSnooze(lesion),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Ustawienia przypomnień — na dole: najpierw treść, potem konfiguracja */}
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

        {notificationsSupported() ? (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifyOnOpen}
              onChange={toggleNotifyOnOpen}
              className="h-5 w-5 rounded border-slate-300 text-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-600 dark:bg-slate-800"
            />
            <span>Powiadom przy otwarciu, gdy są zaległe kontrole</span>
          </label>
        ) : null}

      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Daty są wyliczane z ostatniego zdjęcia + interwał (albo z ręcznie
        przesuniętej daty). To organizacja dokumentacji, nie ocena medyczna.
      </p>
    </div>
  )
}
