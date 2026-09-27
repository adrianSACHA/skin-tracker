import { describe, it, expect } from 'vitest'
import {
  areaLabel,
  areaOrder,
  isPredefinedArea,
  lesionPrefix,
  nextLesionLabel,
  slugify,
} from './bodyAreas'

describe('slugify', () => {
  it('spacje → myślnik, małe litery', () => {
    expect(slugify('Plecy środek')).toBe('plecy-środek')
  })

  it('zachowuje polskie znaki', () => {
    expect(slugify(' Łopatka prawa ')).toBe('łopatka-prawa')
  })

  it('em dash i wielokrotne separatory zwijane do jednego', () => {
    expect(slugify('Nogi — przód')).toBe('nogi-przód')
    expect(slugify('a   b--c')).toBe('a-b-c')
  })

  it('pusty / sam separator → pusty string', () => {
    expect(slugify('')).toBe('')
    expect(slugify('   ')).toBe('')
    expect(slugify('—')).toBe('')
  })
})

describe('areaLabel', () => {
  it('predefiniowany klucz → etykieta', () => {
    expect(areaLabel('front')).toBe('Przód')
    expect(areaLabel('back')).toBe('Tył')
  })

  it('własna nazwa przechodzi wprost', () => {
    expect(areaLabel('znamię na plecach')).toBe('znamię na plecach')
  })

  it('pusto → pusto', () => {
    expect(areaLabel('')).toBe('')
    expect(areaLabel(null)).toBe('')
  })
})

describe('isPredefinedArea / areaOrder', () => {
  it('rozpoznaje klucze słownika', () => {
    expect(isPredefinedArea('kark')).toBe(true)
    expect(isPredefinedArea('moja okolica')).toBe(false)
  })

  it('własne widoki lądują na końcu', () => {
    expect(areaOrder('front')).toBeLessThan(areaOrder('moja okolica'))
  })
})

describe('lesionPrefix', () => {
  it('prosta okolica', () => {
    expect(lesionPrefix('back')).toBe('Tył')
  })

  it('spacje → myślnik', () => {
    expect(lesionPrefix('left')).toBe('Bok-lewy')
  })

  it('em dash w etykiecie → myślnik', () => {
    expect(lesionPrefix('legs_front')).toBe('Nogi-przód')
    expect(lesionPrefix('plecy-srodek')).toBe('Plecy-środek')
  })

  it('własna nazwa', () => {
    expect(lesionPrefix('plecy prawa')).toBe('plecy-prawa')
  })
})

describe('nextLesionLabel', () => {
  it('brak znamion → numer 1', () => {
    expect(nextLesionLabel('back', [])).toBe('Tył-1')
  })

  it('uwzględnia najwyższy numer, nie liczbę znamion', () => {
    const lesions = [
      { label: 'Tył-1' },
      { label: 'Tył-3' },
      { label: 'Tył-2' },
    ]
    expect(nextLesionLabel('back', lesions)).toBe('Tył-4')
  })

  it('pomija inne prefiksy i nazwy ręczne', () => {
    const lesions = [
      { label: 'Przód-5' },
      { label: 'znamię przy łopatce' },
      { label: 'Tył-2' },
    ]
    expect(nextLesionLabel('back', lesions)).toBe('Tył-3')
  })

  it('nie myli się na pod-prefiksach', () => {
    const lesions = [{ label: 'Bok-lewy-9' }]
    expect(nextLesionLabel('left', lesions)).toBe('Bok-lewy-10')
    // „Bok prawy" nie łapie „Bok-lewy-9"
    expect(nextLesionLabel('right', lesions)).toBe('Bok-prawy-1')
  })

  it('po zmianie nazwy widoku prefiks idzie za nową nazwą', () => {
    // Ticket 02: rename nie przepisuje starych etykiet, ale nowe znamiona
    // dostają prefiks nowej okolicy.
    expect(nextLesionLabel('plecy-srodek', [])).toBe('Plecy-środek-1')
  })

  it('bez etykiety → pusty (brak prefiksu)', () => {
    expect(nextLesionLabel('', [])).toBe('')
  })
})
