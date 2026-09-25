import { describe, it, expect } from 'vitest'
import {
  bboxFromMask,
  bboxFromMaskInImage,
  bboxFromPoints,
  normalizeBox,
  denormalizeBox,
  lesionCenterNorm,
  mmCenteredCropBox,
  suggestFovMm,
} from './crop'

function makeMask(width, height, blob) {
  const data = new Float32Array(width * height)
  for (let y = blob.y; y < blob.y + blob.h; y += 1) {
    for (let x = blob.x; x < blob.x + blob.w; x += 1) data[y * width + x] = 0.9
  }
  return { data, width, height }
}

describe('bboxFromMask', () => {
  it('zwraca bounding box niepustych pikseli', () => {
    const mask = makeMask(200, 150, { x: 10, y: 12, w: 40, h: 20 })
    expect(bboxFromMask(mask)).toEqual({ x: 10, y: 12, w: 40, h: 20 })
  })

  it('pusta maska -> null', () => {
    expect(bboxFromMask(makeMask(50, 50, { x: 0, y: 0, w: 0, h: 0 }))).toBeNull()
  })
})

describe('bboxFromMaskInImage', () => {
  it('skaluje współrzędne maski do rozmiaru obrazu', () => {
    const mask = makeMask(100, 100, { x: 10, y: 10, w: 20, h: 20 })
    expect(bboxFromMaskInImage(mask, 400, 300)).toEqual({
      x: 40,
      y: 30,
      w: 80,
      h: 60,
    })
  })
})

describe('bboxFromPoints', () => {
  it('liczy bbox punktów znormalizowanych', () => {
    const b = bboxFromPoints(
      [
        { x: 0.6, y: 0.5 },
        { x: 0.8, y: 0.7 },
        { x: 0.7, y: 0.9 },
      ],
      300,
      200
    )
    expect(b).toEqual({ x: 180, y: 100, w: 60, h: 80 })
  })
})

describe('normalizeBox / denormalizeBox', () => {
  it('round-trip', () => {
    const box = { x: 10, y: 20, w: 50, h: 60 }
    const n = normalizeBox(box, 200, 300)
    expect(denormalizeBox(n, 200, 300)).toEqual(box)
  })
})

describe('lesionCenterNorm', () => {
  it('zwraca środek bounding boxa znamienia (znormalizowany)', () => {
    const mask = makeMask(100, 100, { x: 40, y: 36, w: 20, h: 24 })
    expect(lesionCenterNorm({ mask, imgW: 400, imgH: 400 })).toEqual({ x: 0.5, y: 0.48 })
  })

  it('null bez maski i bez obrysu', () => {
    expect(lesionCenterNorm({ mask: null, points: [], imgW: 100, imgH: 100 })).toBeNull()
  })
})

describe('mmCenteredCropBox', () => {
  it('bok = fovMm * pxPerMm, wyśrodkowany', () => {
    const crop = mmCenteredCropBox({ center: { x: 0.5, y: 0.5 }, pxPerMm: 5, fovMm: 40, imgW: 400, imgH: 400 })
    expect(denormalizeBox(crop, 400, 400)).toEqual({ x: 100, y: 100, w: 200, h: 200 })
  })

  it('niezależny od odległości: stała realna skala kadru', () => {
    const near = mmCenteredCropBox({ center: { x: 0.5, y: 0.5 }, pxPerMm: 5, fovMm: 40, imgW: 400, imgH: 400 })
    const far = mmCenteredCropBox({ center: { x: 0.5, y: 0.5 }, pxPerMm: 2.5, fovMm: 40, imgW: 400, imgH: 400 })
    expect(denormalizeBox(far, 400, 400).w).toBeCloseTo(denormalizeBox(near, 400, 400).w / 2, 5)
  })

  it('klampuje do granic obrazu', () => {
    const crop = mmCenteredCropBox({ center: { x: 0.05, y: 0.05 }, pxPerMm: 5, fovMm: 40, imgW: 400, imgH: 400 })
    const b = denormalizeBox(crop, 400, 400)
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.x + b.w).toBeLessThanOrEqual(400)
  })

  it('null bez danych', () => {
    expect(mmCenteredCropBox({ center: null, pxPerMm: 5, fovMm: 40, imgW: 400, imgH: 400 })).toBeNull()
  })
})

describe('suggestFovMm', () => {
  it('3x średnica, zaokrąglone do 5 mm', () => {
    expect(suggestFovMm(10)).toBe(30)
    expect(suggestFovMm(12)).toBe(35)
  })

  it('klampuje do 15-120', () => {
    expect(suggestFovMm(2)).toBe(15)
    expect(suggestFovMm(100)).toBe(120)
  })

  it('bez sensownego rozmiaru -> 40', () => {
    expect(suggestFovMm(0)).toBe(40)
    expect(suggestFovMm(NaN)).toBe(40)
  })
})
