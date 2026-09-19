import { STATUSES, statusMeta } from '../lib/status'
import { formatDate } from '../lib/date'
import StatusBadge from './StatusBadge'
import SignedImage from './SignedImage'

// Panel informacyjny obok mapy ciała (desktop: kolumna sticky).
// Stan domyślny = podpowiedź; po wybraniu pina = szczegóły + szybkie akcje.
export default function LesionInfoPanel({
  lesion,
  editForm,
  onEditFormChange,
  onSaveEdit,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onOpenDetail,
  onStartMove,
  moveModeId,
  onStatusChange,
  onClose,
}) {
  if (!lesion) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Kliknij znamię na mapie, aby zobaczyć szczegóły.
      </div>
    )
  }

  const photos = lesion.lesion_photos || []
  const last = photos.length
    ? photos.reduce((m, p) => (m && m.taken_at > p.taken_at ? m : p), null)
    : null
  const moving = moveModeId === lesion.id

  const selectClass =
    'min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
  const btnPrimary =
    'min-h-[40px] rounded-lg bg-teal-700 px-3 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500'
  const btnSecondary =
    'min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">
            {lesion.label}
          </h2>
          <div className="mt-1">
            <StatusBadge status={lesion.status} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:hover:text-slate-200"
        >
          Zamknij
        </button>
      </div>

      {/* Ostatnie zdjęcie + liczba sesji */}
      {last ? (
        <div className="flex gap-3">
          <SignedImage
            path={last.photo_url}
            alt="Ostatnie zdjęcie znamienia"
            className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
          />
          <div className="text-sm">
            <p className="text-slate-500 dark:text-slate-400">
              Ostatnie zdjęcie
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {formatDate(last.taken_at)}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Sesji: {photos.length}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Brak zapisanych zdjęć.
        </p>
      )}

      {/* Szybka zmiana statusu */}
      {!editForm ? (
        <div>
          <label
            htmlFor="quick-status"
            className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
          >
            Status
          </label>
          <select
            id="quick-status"
            value={lesion.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={selectClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusMeta(s).label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {editForm ? (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="pin-label"
              className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
            >
              Nazwa / opis
            </label>
            <input
              id="pin-label"
              type="text"
              value={editForm.label}
              onChange={(e) =>
                onEditFormChange({ ...editForm, label: e.target.value })
              }
              className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label
              htmlFor="pin-status"
              className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
            >
              Status
            </label>
            <select
              id="pin-status"
              value={editForm.status}
              onChange={(e) =>
                onEditFormChange({ ...editForm, status: e.target.value })
              }
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusMeta(s).label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={savingEdit}
              className={btnPrimary}
            >
              {savingEdit ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
            <button type="button" onClick={onCancelEdit} className={btnSecondary}>
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpenDetail} className={btnPrimary}>
            Zobacz pełną historię
          </button>
          <button
            type="button"
            onClick={onStartMove}
            disabled={moving}
            className={btnSecondary}
          >
            {moving ? 'Przesuwanie…' : 'Przesuń'}
          </button>
          <button type="button" onClick={onStartEdit} className={btnSecondary}>
            Edytuj
          </button>
        </div>
      )}

      {moving ? (
        <p className="text-xs text-teal-700 dark:text-teal-300">
          Przeciągnij pin na docelowe miejsce. Po puszczeniu pozycja zapisze się
          automatycznie.
        </p>
      ) : null}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Usuń znamię w widoku szczegółów (sekcja „Zarządzanie").
      </p>
    </div>
  )
}
