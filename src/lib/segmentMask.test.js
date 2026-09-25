import { describe, it, expect } from 'vitest'
import { maskValueAt, correctMaskPolarity } from './segmentMask'

function makeMask(width, height, fill) {
  const data = new Float32Array(width * height)
  for (let i = 0; i < data.length; i += 1) data[i] = fill
  return { data, width, height }
}

describe('maskValueAt', () => {
  it('czyta piksel pod punktem znormalizowanym', () => {
    const m = makeMask(10, 10, 0)
    m.data[5 * 10 + 5] = 0.9
    expect(maskValueAt(m.data, 10, 10, 0.5, 0.5)).toBeCloseTo(0.9, 5)
  })

  it('przycina współrzędne do granic maski', () => {
    const m = makeMask(4, 4, 0.4)
    expect(maskValueAt(m.data, 4, 4, 2, -1)).toBeCloseTo(0.4, 5)
  })
})

describe('correctMaskPolarity', () => {
  it('NIE zmienia maski, gdy punkt kliknięcia jest w obiekcie (poprawna polaryzacja)', () => {
    const m = makeMask(10, 10, 0)
    m.data[5 * 10 + 5] = 0.9
    const out = correctMaskPolarity(m.data, 10, 10, [{ x: 0.5, y: 0.5 }])
    expect(out[5 * 10 + 5]).toBeCloseTo(0.9, 5)
    expect(out[0]).toBeCloseTo(0, 5)
  })

  it('ODWRACA maskę, gdy punkt kliknięcia wypada poza nią (tło zamiast znamienia)', () => {
    const m = makeMask(10, 10, 0.9)
    m.data[5 * 10 + 5] = 0 // "znamię" ma 0 → to odwrotność
    const out = correctMaskPolarity(m.data, 10, 10, [{ x: 0.5, y: 0.5 }])
    expect(out[5 * 10 + 5]).toBeCloseTo(1, 5)
    expect(out[0]).toBeCloseTo(0.1, 5)
  })

  it('brak punktów -> bez zmian (ten sam obiekt)', () => {
    const m = makeMask(4, 4, 0.3)
    expect(correctMaskPolarity(m.data, 4, 4, [])).toBe(m.data)
  })
})
