import { describe, it, expect } from 'vitest'
import {
  bboxFromMask,
  bboxFromMaskInImage,
  bboxFromPoints,
  squareCropBoxPx,
  normalizeBox,
  denormalizeBox,
  centeredCropBox,
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

describe('squareCropBoxPx', () => {
  it('kadr kwadratowy z paddingiem', () => {
    const box = squareCropBoxPx({ x: 10, y: 12, w: 40, h: 20 }, 200, 150, 0.25)
    expect(box).toEqual({ x: 5, y: 0, w: 50, h: 50 })
  })

  it('przycina do krawędzi, zachowując kwadrat', () => {
    const box = squareCropBoxPx({ x: 0, y: 0, w: 30, h: 30 }, 100, 100, 0.2)
    expect(box.w).toBe(box.h)
    expect(box.x).toBe(0)
    expect(box.y).toBe(0)
    expect(box.x + box.w).toBeLessThanOrEqual(100)
    expect(box.y + box.h).toBeLessThanOrEqual(100)
  })

  it('bok nie przekracza krótszego wymiaru obrazu', () => {
    const box = squareCropBoxPx({ x: 0, y: 0, w: 100, h: 10 }, 100, 40, 0.5)
    expect(box.w).toBeLessThanOrEqual(40)
    expect(box.h).toBeLessThanOrEqual(40)
  })
})

describe('normalizeBox / denormalizeBox', () => {
  it('round-trip', () => {
    const box = { x: 10, y: 20, w: 50, h: 60 }
    const n = normalizeBox(box, 200, 300)
    expect(denormalizeBox(n, 200, 300)).toEqual(box)
  })
})

describe('centeredCropBox', () => {
  it('z maski -> kwadratowy kadr wokół znamienia (z marginesem)', () => {
    const mask = makeMask(100, 100, { x: 40, y: 40, w: 20, h: 20 })
    const crop = centeredCropBox({ mask, points: null, imgW: 400, imgH: 400 })
    // bbox 80px, padding 1.0 -> bok 160px, środek (200,200) -> (120,120,160,160)
    expect(denormalizeBox(crop, 400, 400)).toEqual({
      x: 120,
      y: 120,
      w: 160,
      h: 160,
    })
  })

  it('małe znamię -> kadr nie mniejszy niż minSideFraction (limit zoomu)', () => {
    const mask = makeMask(100, 100, { x: 48, y: 48, w: 4, h: 4 })
    const crop = centeredCropBox({ mask, points: null, imgW: 400, imgH: 400 })
    // bbox 16px, padding 1.0 -> 32px, ale min bok = 0.4*400 = 160
    expect(denormalizeBox(crop, 400, 400)).toEqual({
      x: 120,
      y: 120,
      w: 160,
      h: 160,
    })
  })

  it('pusta maska i brak punktów -> null (fallback)', () => {
    expect(
      centeredCropBox({
        mask: makeMask(10, 10, { x: 0, y: 0, w: 0, h: 0 }),
        imgW: 100,
        imgH: 100,
      })
    ).toBeNull()
    expect(
      centeredCropBox({ mask: null, points: [], imgW: 100, imgH: 100 })
    ).toBeNull()
  })

  it('z obrysu ręcznego, gdy brak maski (kwadrat)', () => {
    const crop = centeredCropBox({
      mask: null,
      points: [
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.6 },
        { x: 0.5, y: 0.7 },
      ],
      imgW: 200,
      imgH: 200,
    })
    expect(crop).not.toBeNull()
    expect(crop.w).toBeCloseTo(crop.h, 5)
  })
})
