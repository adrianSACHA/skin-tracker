export default function LoadingFallback({ label = 'Wczytywanie…' }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-gray-600 dark:text-slate-300">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-teal-700 dark:border-slate-700 dark:border-t-teal-400" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}
