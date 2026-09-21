// Czysty model widoku listy znamion - bez JSX i bez I/O, więc łatwy do testów.
// Współdzielony przez `LesionsList` i `Reminders` (usuwa duplikat `lastPhotoDate`).
import { addWeeksYMD, daysBetween, todayYMD } from './date'
import { STATUS_PRIORITY } from './status'

// Data najpóźniejszego zdjęcia ("ostatnia sesja") albo null, gdy brak zdjęć.
export function lastPhotoDate(photos) {
  if (!photos || photos.length === 0) return null
  return photos.reduce(
    (max, p) => (max && max > p.taken_at ? max : p.taken_at),
    null
  )
}

// Termin kontroli wyliczony z samego interwału: ostatnie zdjęcie + interwał
// (albo dziś + interwał, gdy nie ma jeszcze żadnego zdjęcia).
export function computedNext(last, intervalWeeks, today = todayYMD()) {
  return addWeeksYMD(last || today, intervalWeeks)
}

// Termin kontroli "efektywny": ręcznie ustawiony (`next_check_at`) ma
// pierwszeństwo, w przeciwnym razie wyliczony.
export function effectiveNext(last, intervalWeeks, nextCheckAt, today = todayYMD()) {
  return nextCheckAt || computedNext(last, intervalWeeks, today)
}

// Wiersze widoku dla listy znamion. `today` podawane jawnie, by wynik był
// deterministyczny i testowalny.
export function buildRows(lesions, { intervalWeeks, today = todayYMD() } = {}) {
  return (lesions || []).map((lesion) => {
    const last = lastPhotoDate(lesion.lesion_photos)
    return {
      lesion,
      last,
      // Termin kontroli: ręczny (`next_check_at`) ma pierwszeństwo nad wyliczonym.
      next: effectiveNext(last, intervalWeeks, lesion.next_check_at, today),
      overdueDays: last ? daysBetween(last, today) : null,
    }
  })
}

// Filtr po statusie; pusta lista = brak filtra (pokazujemy wszystko).
export function filterByStatus(rows, statuses = []) {
  if (!statuses || statuses.length === 0) return rows
  const allowed = new Set(statuses)
  return rows.filter((row) => allowed.has(row.lesion.status))
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
