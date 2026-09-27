// Słownik okolic ciała (= widoków mapy) + reguły nazw znamion.
// Czysty moduł bez JSX i I/O — łatwy do testów.
//
// Ustalenia (mapa `.scratch/mapa-widoki-znamiona`):
// - Predefiniowanych okolic nie usuwamy; użytkownik może dodać własną.
// - `body_maps.view_name` trzyma klucz słownika albo własną nazwę zapisaną
//   wprost. Dzięki temu stare rekordy (`front`, `back`, ...) działają dalej.
// - Prefiks nazwy znamienia jest niezmienny po zmianie nazwy widoku (ticket 02)
//   — dlatego rename NIE przepisuje istniejących `lesions.label`.

export const BODY_AREAS = [
  { key: 'front', label: 'Przód' },
  { key: 'back', label: 'Tył' },
  { key: 'left', label: 'Bok lewy' },
  { key: 'right', label: 'Bok prawy' },
  { key: 'legs_front', label: 'Nogi — przód' },
  { key: 'legs_back', label: 'Nogi — tył' },
  { key: 'kark', label: 'Kark' },
  { key: 'twarz', label: 'Twarz' },
  { key: 'plecy-srodek', label: 'Plecy — środek' },
  { key: 'ramie-lewe', label: 'Ramię lewe' },
  { key: 'ramie-prawe', label: 'Ramię prawe' },
  { key: 'dlon-lewa', label: 'Dłoń lewa' },
  { key: 'dlon-prawa', label: 'Dłoń prawa' },
  { key: 'noga-lewa', label: 'Noga lewa' },
  { key: 'noga-prawa', label: 'Noga prawa' },
  { key: 'stopa-lewa', label: 'Stopa lewa' },
  { key: 'stopa-prawa', label: 'Stopa prawa' },
]

// Wartość „własna nazwa" w dropdownach.
export const CUSTOM_AREA = '__custom__'

// Klucz z dowolnej nazwy: małe litery, spacje i separatory → `-`,
// polskie znaki zachowane (np. „Plecy środek" → `plecy-srodek`).
export function slugify(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^0-9a-ząćęłńóśźż-]+/gi, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Etykieta widoku z `view_name` — słownik albo własna nazwa wprost.
export function areaLabel(viewName) {
  if (!viewName) return ''
  const hit = BODY_AREAS.find((a) => a.key === viewName)
  return hit ? hit.label : viewName
}

// Czy `viewName` to predefiniowany klucz słownika (a nie własna nazwa).
export function isPredefinedArea(viewName) {
  return BODY_AREAS.some((a) => a.key === viewName)
}

// Kolejność widoków: najpierw wg słownika, własne na końcu.
export function areaOrder(viewName) {
  const i = BODY_AREAS.findIndex((a) => a.key === viewName)
  return i === -1 ? BODY_AREAS.length : i
}

// Prefiks nazwy znamienia z etykiety okolicy:
// „Tył" → `Tył`, „Bok lewy" → `Bok-lewy`, „Nogi — przód" → `Nogi-przód`.
export function lesionPrefix(viewName) {
  return areaLabel(viewName)
    .replace(/\s*[—–]\s*/g, '-')
    .replace(/\s+/g, '-')
}

// Domyślna nazwa kolejnego znamienia: `Prefiks-N`, gdzie N = 1 + najwyższy
// istniejący numer dla tego prefiksu (w obrębie podanych znamion).
export function nextLesionLabel(viewName, lesionsInView) {
  const prefix = lesionPrefix(viewName)
  if (!prefix) return ''
  const re = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`)
  let max = 0
  for (const lesion of lesionsInView || []) {
    const match = re.exec(String(lesion?.label || '').trim())
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `${prefix}-${max + 1}`
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
