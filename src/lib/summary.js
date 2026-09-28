// Podsumowanie osoby dla karty na ekranie wyboru: ile ma znamion i zdjęć oraz
// kiedy wypada najbliższa kontrola. Czysta funkcja (bez JSX, bez I/O), więc
// testowalna tak samo jak `lesionView.js`.
//
// Terminy liczy `dueRows` - ta sama logika co Kontrole i znacznik w nagłówku,
// żeby liczby na karcie nie rozjechały się z resztą aplikacji.
import { dueRows } from './lesionView'
import { DEFAULT_INTERVAL_WEEKS } from './settings'

// Polska odmiana rzeczownika po liczbie: 1 znamię, 2-4 znamiona, 5+ znamion.
// Formę „few” łapią końcówki 2-4, ale nie 12-14 (np. 12 znamion, nie 12 znamiona).
export function pluralPl(count, one, few, many) {
  const n = Math.abs(Number(count) || 0)
  if (n === 1) return one
  const rest10 = n % 10
  const rest100 = n % 100
  const isFew = rest10 >= 2 && rest10 <= 4 && !(rest100 >= 12 && rest100 <= 14)
  return isFew ? few : many
}

// Liczba zdjęć wszystkich znamion osoby.
export function countPhotos(lesions) {
  return (lesions || []).reduce(
    (sum, lesion) => sum + (lesion?.lesion_photos?.length || 0),
    0
  )
}

/**
 * Liczby i najbliższy termin kontroli dla jednej osoby.
 *
 * `overdue` dotyczy TEGO najbliższego terminu (czyli czy karta ma być czerwona).
 *
 * Dwie różne rzeczy liczone są celowo różnie:
 * - `lesionCount` / `photoCount` - cała dokumentacja, także znamiona
 *   „Usunięte” (karta opisuje stan archiwum, a lista znamion też je pokazuje),
 * - `next` / `overdue` - tylko znamiona, które mają czego pilnować, czyli bez
 *   „Usuniętych” (`dueRows`). Dzięki temu termin zgadza się ze znacznikiem przy
 *   „Kontrole” i z listą Kontroli.
 *
 * @param {Array} lesions znamiona osoby (płaskie, jak z `lesions`)
 * @param {{ intervalWeeks?: number, today?: string }} [options]
 */
export function summarizePerson(lesions, { intervalWeeks, today } = {}) {
  const list = lesions || []
  const rows = dueRows(list, {
    intervalWeeks: intervalWeeks || DEFAULT_INTERVAL_WEEKS,
    today,
  })

  let next = null
  let overdue = false
  for (const row of rows) {
    if (!row.next) continue
    if (next === null || row.next < next) {
      next = row.next
      overdue = Boolean(row.overdue)
    }
  }

  return {
    lesionCount: list.length,
    photoCount: countPhotos(list),
    next,
    overdue,
  }
}
