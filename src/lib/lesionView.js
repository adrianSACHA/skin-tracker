// Czysty model widoku listy znamion - bez JSX i bez I/O, więc łatwy do testów.
// Publiczny szew: `buildRows`, `filterByStatus`, `sortRows`, `sortRowsByNext`.
// Współdzielony przez `LesionsList` i `Reminders` (usuwa duplikat `lastPhotoDate`).
import { addWeeksYMD, daysBetween, todayYMD } from './date'
import { STATUS_PRIORITY } from './status'
import { areaLabel } from './bodyAreas'

// Wiersze widoku dla listy znamion. `today` podawane jawnie, by wynik był
// deterministyczny i testowalny.
export function buildRows(lesions, { intervalWeeks, today = todayYMD() } = {}) {
  return (lesions || []).map((lesion) => {
    const last = lastPhotoDate(lesion.lesion_photos)
    // Termin kontroli: ręczny (`next_check_at`) ma pierwszeństwo nad wyliczonym
    // (ostatnie zdjęcie + interwał, albo dziś + interwał, gdy brak zdjęć).
    const computed = addWeeksYMD(last || today, intervalWeeks)
    const next = lesion.next_check_at || computed
    const daysUntilNext = daysBetween(today, next)
    return {
      lesion,
      last,
      next,
      daysUntilNext,
      // Zaległe = termin już minął (spójnie z Kontrolami).
      overdue: daysUntilNext !== null && daysUntilNext < 0,
    }
  })
}

// Filtr po statusie; pusta lista = brak filtra (pokazujemy wszystko).
export function filterByStatus(rows, statuses = []) {
  if (!statuses || statuses.length === 0) return rows
  const allowed = new Set(statuses)
  return rows.filter((row) => allowed.has(row.lesion.status))
}

// Filtr tekstowy: dopasuj do nazwy znamienia albo okolicy (bez wielkości liter).
export function filterByQuery(rows, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return rows
  return (rows || []).filter((row) => {
    const view = row.lesion?.body_maps?.view_name
    const label = String(row.lesion?.label || '').toLowerCase()
    const area = String(areaLabel(view) || '').toLowerCase()
    return label.includes(q) || area.includes(q)
  })
}

// Kolejność listy: najpierw pilność statusu, potem dawniej kontrolowane na górze.
export function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.lesion.status] ?? 9
    const pb = STATUS_PRIORITY[b.lesion.status] ?? 9
    if (pa !== pb) return pa - pb
    return (a.last || '').localeCompare(b.last || '')
  })
}

// Kolejność wg `Terminu kontroli`: najpilniejsze (najwcześniejsze) na górze,
// znamiona bez terminu na końcu, a przy równych terminach - alfabetycznie
// po nazwie (żeby kolejność była zdeterminowana).
export function sortRowsByNext(rows) {
  return [...rows].sort((a, b) => {
    const na = a.next || ''
    const nb = b.next || ''
    if (!na && !nb) return byLabel(a, b)
    if (!na) return 1
    if (!nb) return -1
    if (na !== nb) return na.localeCompare(nb)
    return byLabel(a, b)
  })
}

// Podsumowanie terminów: ile zaległych i ile „wkrótce" (w ciągu `soonDays`).
export function summarizeDue(rows, soonDays = 30) {
  let overdue = 0
  let soon = 0
  for (const row of rows || []) {
    if (row.overdue) {
      overdue += 1
    } else if (
      row.daysUntilNext !== null &&
      row.daysUntilNext !== undefined &&
      row.daysUntilNext <= soonDays
    ) {
      soon += 1
    }
  }
  return { overdue, soon }
}

// Data najpóźniejszego zdjęcia ("ostatnie zdjęcie") albo null, gdy brak zdjęć.
function lastPhotoDate(photos) {
  if (!photos || photos.length === 0) return null
  return photos.reduce(
    (max, p) => (max && max > p.taken_at ? max : p.taken_at),
    null
  )
}

function byLabel(a, b) {
  return (a.lesion.label || '').localeCompare(b.lesion.label || '')
}
