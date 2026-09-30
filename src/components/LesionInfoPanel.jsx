import { STATUSES, statusMeta } from '../lib/status'
import { formatDate } from '../lib/date'
import StatusBadge from './StatusBadge'
import SignedImage from './SignedImage'
import LesionName from './LesionName'

// Panel informacyjny obok mapy ciała (desktop: kolumna sticky).
// Stan domyślny = podpowiedź; po wybraniu pina = szczegóły + szybkie akcje.
export default function LesionInfoPanel({
  lesion,
  viewName,
  editForm,
  onEditFormChange,
  onSaveEdit,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onOpenDetail,
  // Nowo utworzone znamię: znamię bez zdjęcia nie ma ani rozmiaru, ani
  // porównania, więc zamiast „Zobacz pełną historię” proponujemy wprost
  // pierwsze zdjęcie (ticket 14, ustalenie 4).
  justCreated = false,
  onAddFirstPhoto,
  onStartMove,
  moveModeId,
  onStatusChange,
  onClose,
}) {
  if (!lesion) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Kliknij znamię na mapie, aby zobaczyć szczegóły.
      </p>
    )
  }

  const photos = lesion.lesion_photos || []
  const last = photos.length
    ? photos.reduce((m, p) => (m && m.taken_at > p.taken_at ? m : p), null)
    : null
  const moving = moveModeId === lesion.id

  const selectClass =
    'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
  const btnPrimary =
    'min-h-[44px] rounded-lg bg-teal-700 px-3 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-700 dark:hover:bg-teal-800'
  const btnSecondary =
    'min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">
            <LesionName
              label={lesion.label}
              viewName={viewName}
              areaClassName="font-normal text-slate-500 dark:text-slate-400"
            />
          </h2>
          <div className="mt-1">
            <StatusBadge status={lesion.status} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:text-slate-300 dark:hover:text-slate-100"
        >
          Zamknij
        </button>
      </div>

      {/* Ostatnie zdjęcie + liczba zdjęć */}
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
              Zdjęć: {photos.length}
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
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
          {justCreated ? (
            <button
              type="button"
              onClick={onAddFirstPhoto}
              className={btnPrimary}
            >
              Dodaj pierwsze zdjęcie
            </button>
          ) : (
            <button type="button" onClick={onOpenDetail} className={btnPrimary}>
              Zobacz pełną historię
            </button>
          )}
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

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Usuń znamię w widoku szczegółów (menu „⋯” obok nazwy).
      </p>
    </div>
  )
}
