import { describe, expect, it } from 'vitest'
import { countPhotos, pluralPl, summarizePerson } from './summary'

describe('pluralPl', () => {
  it('forma pojedyncza tylko dla 1', () => {
    expect(pluralPl(1, 'znamię', 'znamiona', 'znamion')).toBe('znamię')
  })

  it('końcówki 2-4 biorą formę mnogą „few”', () => {
    for (const n of [2, 3, 4, 22, 23, 34]) {
      expect(pluralPl(n, 'znamię', 'znamiona', 'znamion')).toBe('znamiona')
    }
  })

  it('12-14 to wyjątek - forma „many”', () => {
    for (const n of [12, 13, 14, 112, 113]) {
      expect(pluralPl(n, 'znamię', 'znamiona', 'znamion')).toBe('znamion')
    }
  })

  it('pozostałe liczby to forma „many”', () => {
    for (const n of [0, 5, 10, 11, 15, 21, 100]) {
      expect(pluralPl(n, 'znamię', 'znamiona', 'znamion')).toBe('znamion')
    }
  })

  it('radzi sobie z brakiem wartości', () => {
    expect(pluralPl(undefined, 'zdjęcie', 'zdjęcia', 'zdjęć')).toBe('zdjęć')
    expect(pluralPl(null, 'zdjęcie', 'zdjęcia', 'zdjęć')).toBe('zdjęć')
  })
})

describe('countPhotos', () => {
  it('sumuje zdjęcia wszystkich znamion', () => {
    const lesions = [
      { lesion_photos: [{ taken_at: '2026-01-01' }, { taken_at: '2026-02-01' }] },
      { lesion_photos: [] },
      { lesion_photos: [{ taken_at: '2026-03-01' }] },
    ]
    expect(countPhotos(lesions)).toBe(3)
  })

  it('brak danych nie wywala liczenia', () => {
    expect(countPhotos(null)).toBe(0)
    expect(countPhotos([])).toBe(0)
    expect(countPhotos([{}, { lesion_photos: null }])).toBe(0)
  })
})

describe('summarizePerson', () => {
  const today = '2026-06-01'

  it('bez znamion zwraca zera i brak terminu', () => {
    expect(summarizePerson([], { today })).toEqual({
      lesionCount: 0,
      photoCount: 0,
      next: null,
      overdue: false,
    })
  })

  it('bierze najwcześniejszy z terminów i flagę zaległości', () => {
    const lesions = [
      // ostatnie zdjęcie 2026-01-05 + 6 tyg. = 2026-02-16 (dawno minęło)
      { id: 'a', lesion_photos: [{ taken_at: '2026-01-05' }] },
      // ręczny termin późniejszy - nie jest najbliższy
      { id: 'b', next_check_at: '2026-12-01', lesion_photos: [] },
    ]

    const summary = summarizePerson(lesions, { intervalWeeks: 6, today })

    expect(summary.lesionCount).toBe(2)
    expect(summary.photoCount).toBe(1)
    expect(summary.next).toBe('2026-02-16')
    expect(summary.overdue).toBe(true)
  })

  it('ręczny termin ma pierwszeństwo nad wyliczonym', () => {
    const lesions = [
      // Bez zdjęć: dziś + 6 tyg. = 2026-07-13, ale ręczny termin jest wcześniej.
      { id: 'a', next_check_at: '2026-06-10', lesion_photos: [] },
    ]

    const summary = summarizePerson(lesions, { intervalWeeks: 6, today })

    expect(summary.next).toBe('2026-06-10')
    expect(summary.overdue).toBe(false)
  })

  it('bez zapisanego interwału używa wartości domyślnej', () => {
    const lesions = [{ id: 'a', lesion_photos: [] }]

    const summary = summarizePerson(lesions, { today })

    // dziś + 6 tygodni
    expect(summary.next).toBe('2026-07-13')
  })
})
