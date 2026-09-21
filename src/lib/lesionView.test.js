import { describe, it, expect } from 'vitest'
import {
  lastPhotoDate,
  computedNext,
  effectiveNext,
  buildRows,
  filterByStatus,
  sortRows,
} from './lesionView'

describe('lastPhotoDate', () => {
  it('zwraca null, gdy brak zdjęć', () => {
    expect(lastPhotoDate([])).toBe(null)
    expect(lastPhotoDate(undefined)).toBe(null)
  })

  it('zwraca datę jedynego zdjęcia', () => {
    expect(lastPhotoDate([{ taken_at: '2025-01-10' }])).toBe('2025-01-10')
  })

  it('zwraca najpóźniejszą datę spośród wielu zdjęć', () => {
    expect(
      lastPhotoDate([
        { taken_at: '2025-01-10' },
        { taken_at: '2025-03-02' },
        { taken_at: '2024-12-31' },
      ])
    ).toBe('2025-03-02')
  })
})

describe('computedNext', () => {
  it('liczy od daty ostatniego zdjęcia', () => {
    expect(computedNext('2025-01-01', 6, '2025-05-05')).toBe('2025-02-12')
  })

  it('bez zdjęcia liczy od podanego dnia', () => {
    expect(computedNext(null, 2, '2025-01-01')).toBe('2025-01-15')
  })
})

describe('effectiveNext', () => {
  it('preferuje ręcznie ustawiony termin', () => {
    expect(effectiveNext('2025-01-01', 6, '2025-09-09', '2025-05-05')).toBe(
      '2025-09-09'
    )
  })

  it('bez ręcznego terminu liczy jak computedNext', () => {
    expect(effectiveNext('2025-01-01', 6, null, '2025-05-05')).toBe('2025-02-12')
  })
})

describe('buildRows', () => {
  const lesions = [
    { id: 'a', status: 'watch', lesion_photos: [{ taken_at: '2025-01-01' }] },
    { id: 'b', status: 'new', lesion_photos: [] },
  ]

  it('buduje wiersze z terminem i liczbą dni od ostatniego zdjęcia', () => {
    const rows = buildRows(lesions, { intervalWeeks: 4, today: '2025-02-01' })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      last: '2025-01-01',
      nextComputed: '2025-01-29',
      overdueDays: 31,
    })
    expect(rows[1]).toMatchObject({
      last: null,
      nextComputed: '2025-03-01',
      overdueDays: null,
    })
  })

  it('ręczny termin trafia tylko do nextEffective', () => {
    const rows = buildRows(
      [
        {
          id: 'a',
          status: 'watch',
          next_check_at: '2025-06-01',
          lesion_photos: [{ taken_at: '2025-01-01' }],
        },
      ],
      { intervalWeeks: 4, today: '2025-02-01' }
    )

    expect(rows[0].nextComputed).toBe('2025-01-29')
    expect(rows[0].nextEffective).toBe('2025-06-01')
  })
})

describe('filterByStatus', () => {
  const rows = [
    { lesion: { status: 'watch' } },
    { lesion: { status: 'new' } },
    { lesion: { status: 'urgent' } },
  ]

  it('pusta lista statusów = pokaż wszystko', () => {
    expect(filterByStatus(rows, [])).toHaveLength(3)
    expect(filterByStatus(rows)).toHaveLength(3)
  })

  it('zawęża do wybranych statusów', () => {
    expect(filterByStatus(rows, ['watch', 'urgent']).map((r) => r.lesion.status)).toEqual([
      'watch',
      'urgent',
    ])
  })
})

describe('sortRows', () => {
  it('sortuje po pilności statusu', () => {
    const rows = [
      { lesion: { status: 'removed' }, last: '2025-01-01' },
      { lesion: { status: 'urgent' }, last: '2025-05-01' },
      { lesion: { status: 'watch' }, last: '2025-02-01' },
    ]

    expect(sortRows(rows).map((r) => r.lesion.status)).toEqual([
      'urgent',
      'watch',
      'removed',
    ])
  })

  it('przy równym statusie: dawniej kontrolowane na górze', () => {
    const rows = [
      { lesion: { status: 'watch' }, last: '2025-05-01' },
      { lesion: { status: 'watch' }, last: '2025-01-01' },
    ]

    expect(sortRows(rows).map((r) => r.last)).toEqual(['2025-01-01', '2025-05-01'])
  })

  it('nie mutuje wejściowej tablicy', () => {
    const rows = [
      { lesion: { status: 'removed' }, last: '2025-01-01' },
      { lesion: { status: 'urgent' }, last: '2025-01-01' },
    ]
    const snapshot = [...rows]

    sortRows(rows)

    expect(rows).toEqual(snapshot)
  })
})
