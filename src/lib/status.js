// Statusy znamion + mapowanie kolorów (używane przy pinach i odznakach).
// UWAGA: to etykiety organizacyjne użytkownika - nie są oceną medyczną.

export const STATUSES = ['new', 'stable', 'watch', 'removed', 'urgent']

export const STATUS_META = {
  new: {
    label: 'Nowe',
    dot: '#3b82f6', // niebieski
    badge:
      'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-800',
  },
  stable: {
    label: 'Stabilne',
    dot: '#22c55e', // zielony
    badge:
      'bg-green-100 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-800',
  },
  watch: {
    label: 'Do obserwacji',
    dot: '#eab308', // żółty
    badge:
      'bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:ring-yellow-800',
  },
  urgent: {
    label: 'Do pilnej konsultacji',
    dot: '#ef4444', // czerwony
    badge:
      'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800',
  },
  removed: {
    label: 'Usunięte',
    dot: '#9ca3af', // szary
    badge:
      'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700',
  },
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.new
}

// Kolejność sortowania na liście (pilniejsze na górze).
export const STATUS_PRIORITY = {
  urgent: 0,
  watch: 1,
  new: 2,
  stable: 3,
  removed: 4,
}
