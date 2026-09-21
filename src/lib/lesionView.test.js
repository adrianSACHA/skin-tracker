import { describe, it, expect } from 'vitest'
import {
  buildRows,
  filterByStatus,
  sortRows,
  sortRowsByNext,
} from './lesionView'

describe('buildRows', () => {
  it('bez zdjęć termin liczy od podanego dnia', () => {
    const rows = buildRows([{ id: 'b', status: 'new', lesion_photos: [] }], {
      intervalWeeks: 2,
      today: '2025-01-01',
    })

    expect(rows[0]).toMatchObject({
      last: null,
      next: '2025-01-15',
      overdue: false,
    })
  })

  it('z wielu zdjęć bierze najpóźniejsze i liczy termin od niego', () => {
    const rows = buildRows(
      [
        {
          id: 'a',
          status: 'watch',
          lesion_photos: [
            { taken_at: '2025-01-10' },
            { taken_at: '2025-03-02' },
            { taken_at: '2024-12-31' },
          ],
        },
      ],
      { intervalWeeks: 4, today: '2025-05-05' }
    )

    expect(rows[0]).toMatchObject({
      last: '2025-03-02',
      next: '2025-03-30',
      overdue: true,
    })
  })

  it('zaległe liczy z terminu: termin w przeszłości', () => {
    const rows = buildRows(
      [
        {
          id: 'a',
          status: 'watch',
          lesion_photos: [{ taken_at: '2025-01-01' }],
        },
      ],
      { intervalWeeks: 4, today: '2025-02-01' }
    )

    expect(rows[0]).toMatchObject({
      last: '2025-01-01',
      next: '2025-01-29',
      overdue: true,
    })
  })

  it('ręczny termin w przyszłości nie jest zaległy', () => {
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

    expect(rows[0]).toMatchObject({ next: '2025-06-01', overdue: false })
  })

  it('ręczny termin w przeszłości jest zaległy', () => {
    const rows = buildRows(
      [
        {
          id: 'a',
          status: 'watch',
          next_check_at: '2025-01-15',
          lesion_photos: [{ taken_at: '2025-01-01' }],
        },
      ],
      { intervalWeeks: 4, today: '2025-02-01' }
    )

    expect(rows[0]).toMatchObject({ next: '2025-01-15', overdue: true })
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
    expect(
      filterByStatus(rows, ['watch', 'urgent']).map((r) => r.lesion.status)
    ).toEqual(['watch', 'urgent'])
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

    expect(sortRows(rows).map((r) => r.last)).toEqual([
      '2025-01-01',
      '2025-05-01',
    ])
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

describe('sortRowsByNext', () => {
  it('sortuje po terminie rosnąco (najpilniejsze na górze)', () => {
    const rows = [
      { lesion: { label: 'c' }, next: '2025-06-01' },
      { lesion: { label: 'a' }, next: '2025-01-01' },
      { lesion: { label: 'b' }, next: '2025-03-01' },
    ]

    expect(sortRowsByNext(rows).map((r) => r.next)).toEqual([
      '2025-01-01',
      '2025-03-01',
      '2025-06-01',
    ])
  })

  it('znamiona bez terminu trafiają na koniec', () => {
    const rows = [
      { lesion: { label: 'x' }, next: null },
      { lesion: { label: 'y' }, next: '2025-02-01' },
    ]

    expect(sortRowsByNext(rows).map((r) => r.lesion.label)).toEqual(['y', 'x'])
  })

  it('przy równych terminach decyduje nazwa (deterministycznie)', () => {
    const rows = [
      { lesion: { label: 'b' }, next: '2025-01-01' },
      { lesion: { label: 'a' }, next: '2025-01-01' },
    ]

    expect(sortRowsByNext(rows).map((r) => r.lesion.label)).toEqual(['a', 'b'])
  })
})
