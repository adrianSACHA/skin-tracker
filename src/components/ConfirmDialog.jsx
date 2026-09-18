import { useEffect, useRef } from 'react'

// Prosty modal potwierdzenia (bez zewnętrznej biblioteki).
// Destrukcyjne akcje wymagają świadomego potwierdzenia przyciskiem w innym
// kolorze niż reszta UI. Esc / klik w tło = anuluj.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Tak, usuń',
  cancelLabel = 'Anuluj',
  onConfirm,
  onCancel,
  busy = false,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', onKey)
    confirmRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2
          id="confirm-title"
          className="text-lg font-semibold text-slate-800 dark:text-slate-100"
        >
          {title}
        </h2>
        {description ? (
          <p
            id="confirm-desc"
            className="text-sm text-slate-600 dark:text-slate-300"
          >
            {description}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-[44px] rounded-lg bg-red-600 px-4 font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-red-600 dark:hover:bg-red-500 dark:disabled:bg-slate-700"
          >
            {busy ? 'Usuwanie…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
