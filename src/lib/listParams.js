// Odczyt/zapis stanu widoku listy (filtr po statusie + sortowanie) w URL.
// Trzymane osobno od modelu wierszy: to warstwa adresu, nie domeny.
import { STATUSES } from './status'

export const DEFAULT_SORT = 'next'
export const SORTS = ['next', 'status']

// Czyta filtr i sortowanie z parametrów URL. Nieznane wartości pomija,
// więc wadliwy URL nie psuje widoku.
export function readListParams(searchParams) {
  const raw = searchParams.get('status') || ''
  const statuses = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => STATUSES.includes(s))

  const rawSort = searchParams.get('sort')
  return {
    statuses,
    sort: SORTS.includes(rawSort) ? rawSort : DEFAULT_SORT,
  }
}

// Buduje parametry URL z aktualnego stanu; wartości domyślne pomija,
// żeby adres zostawał czysty.
export function buildListParams({ statuses, sort }) {
  const params = new URLSearchParams()
  if (statuses && statuses.length > 0) params.set('status', statuses.join(','))
  if (sort && sort !== DEFAULT_SORT) params.set('sort', sort)
  return params
}
