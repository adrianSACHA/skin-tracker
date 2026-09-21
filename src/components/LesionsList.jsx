import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, todayYMD } from '../lib/date'
import { useIntervalWeeks } from '../lib/interval'
import {
  buildRows,
  filterByStatus,
  sortRows,
  sortRowsByNext,
} from '../lib/lesionView'
import { STATUSES, statusMeta } from '../lib/status'
import { readListParams, buildListParams } from '../lib/listParams'
import StatusBadge from './StatusBadge'

export default function LesionsList() {
  const { personId } = useParams()
  const [lesions, setLesions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [intervalWeeks, setIntervalWeeks] = useIntervalWeeks()

  // Filtr i sortowanie żyją w URL (HashRouter) - przetrwają odświeżenie i powrót.
  const { statuses: selectedStatuses, sort: sortBy } = useMemo(
    () => readListParams(searchParams),
    [searchParams]
  )

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

  const { rows, total } = useMemo(() => {
    const built = buildRows(lesions, { intervalWeeks, today: todayYMD() })
    const filtered = filterByStatus(built, selectedStatuses)
    const sorted =
      sortBy === 'status' ? sortRows(filtered) : sortRowsByNext(filtered)
    return { rows: sorted, total: built.length }
  }, [lesions, selectedStatuses, sortBy, intervalWeeks])

  const setListParams = ({ statuses, sort }) => {
    setSearchParams(buildListParams({ statuses, sort }), { replace: true })
  }

  const toggleStatus = (status) => {
    const statuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status]
    setListParams({ statuses, sort: sortBy })
  }

  const clearStatuses = () => setListParams({ statuses: [], sort: sortBy })

  const changeSort = (value) =>
    setListParams({ statuses: selectedStatuses, sort: value })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Lista znamion
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Filtruj po statusie i sprawdzaj sugerowaną datę następnej kontroli.
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
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <fieldset>
          <legend className="mb-2 flex flex-wrap items-center gap-x-2 font-medium text-slate-700 dark:text-slate-200">
            Filtr po statusie
            <span className="font-normal text-slate-500 dark:text-slate-400">
              {rows.length} z {total}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const meta = statusMeta(s)
              const checked = selectedStatuses.includes(s)
              return (
                <label
                  key={s}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-3 transition-colors ${
                    checked
                      ? 'border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStatus(s)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: meta.dot }}
                    aria-hidden="true"
                  />
                  {meta.label}
                </label>
              )
            })}
            {selectedStatuses.length > 0 ? (
              <button
                type="button"
                onClick={clearStatuses}
                className="min-h-[44px] rounded-full px-3 text-sm font-medium text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-300"
              >
                Wyczyść
              </button>
            ) : null}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
              className="min-h-[44px] w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-by">Sortuj</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => changeSort(e.target.value)}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="next">Termin kontroli (najpilniejsze)</option>
              <option value="status">Status (pilność)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wczytywanie znamion…
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {total === 0
            ? 'Brak znamion do wyświetlenia.'
            : 'Brak znamion dla wybranych statusów.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ lesion, last, next, overdue }) => {
            return (
              <li
                key={lesion.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/person/${personId}/lesion/${lesion.id}`}
                      state={{ from: 'list' }}
                      className="text-base font-semibold text-slate-800 hover:text-teal-700 hover:underline dark:text-slate-100 dark:hover:text-teal-300"
                    >
                      {lesion.label}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={lesion.status} />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Ostatnie zdjęcie: {formatDate(last)}
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

                <Link
                  to={`/person/${personId}/reminders`}
                  className="self-start text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
                >
                  Przejdź do kontroli →
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Kolory statusów to prywatna organizacja dokumentacji, nie ocena
        medyczna. W razie wątpliwości skonsultuj się z lekarzem.
      </p>
    </div>
  )
}
