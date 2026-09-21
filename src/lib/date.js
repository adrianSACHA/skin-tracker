// Proste helpery na datach (bez zewnętrznych bibliotek).

export function toYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayYMD() {
  return toYMD(new Date())
}

// Dodaje dni do daty 'YYYY-MM-DD' (brak daty => liczy od dziś).
export function addDaysYMD(ymd, days) {
  const base = ymd ? new Date(`${ymd}T09:00:00`) : new Date()
  base.setDate(base.getDate() + days)
  return toYMD(base)
}

export function addWeeksYMD(ymd, weeks) {
  return addDaysYMD(ymd, weeks * 7)
}

export function formatDate(ymd) {
  if (!ymd) return '—'
  const date = new Date(`${ymd}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Ile dni minęło od danej daty (do wyliczania "zaległych" kontroli).
export function daysSince(ymd) {
  if (!ymd) return null
  const date = new Date(`${ymd}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const diffMs = Date.now() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

// Liczba dni z 'YYYY-MM-DD' do 'YYYY-MM-DD' (dodatnia, gdy `to` jest później).
// Deterministyczne - bez zależności od bieżącego czasu, więc łatwe do testów.
export function daysBetween(fromYMD, toYMD) {
  if (!fromYMD || !toYMD) return null
  const from = new Date(`${fromYMD}T00:00:00`)
  const to = new Date(`${toYMD}T00:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}
