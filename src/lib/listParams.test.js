import { describe, it, expect } from 'vitest'
import { readListParams, buildListParams, DEFAULT_SORT } from './listParams'

describe('readListParams', () => {
  it('brak parametrów = brak filtra i domyślne sortowanie', () => {
    expect(readListParams(new URLSearchParams(''))).toEqual({
      statuses: [],
      sort: DEFAULT_SORT,
    })
  })

  it('czyta wiele statusów', () => {
    const { statuses } = readListParams(
      new URLSearchParams('status=watch,urgent')
    )
    expect(statuses).toEqual(['watch', 'urgent'])
  })

  it('nieznane statusy i sortowania są pomijane (wadliwy URL nie psuje widoku)', () => {
    const { statuses, sort } = readListParams(
      new URLSearchParams('status=watch,bzdura,urgent&sort=nieznane')
    )
    expect(statuses).toEqual(['watch', 'urgent'])
    expect(sort).toBe(DEFAULT_SORT)
  })

  it('czyta sortowanie "status"', () => {
    expect(
      readListParams(new URLSearchParams('sort=status')).sort
    ).toBe('status')
  })
})

describe('buildListParams', () => {
  it('domyślny stan = pusty URL', () => {
    expect(
      buildListParams({ statuses: [], sort: DEFAULT_SORT }).toString()
    ).toBe('')
  })

  it('zapisuje statusy i sortowanie', () => {
    const params = buildListParams({
      statuses: ['watch', 'urgent'],
      sort: 'status',
    })
    expect(params.get('status')).toBe('watch,urgent')
    expect(params.get('sort')).toBe('status')
  })

  it('domyślnego sortowania nie zapisuje', () => {
    expect(
      buildListParams({ statuses: ['new'], sort: DEFAULT_SORT }).get('sort')
    ).toBe(null)
  })
})
