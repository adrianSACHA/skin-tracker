// Geometria kadru centrującego znamię (decyzja 05 + ticket 11).
// Funkcje czyste operują na pikselach obrazu (albo współrzędnych 0..1),
// dzięki czemu są testowalne bez DOM. `cropImageToBlob` używa <canvas>.

// Bounding box niepustych pikseli maski (współrzędne maski).
export function bboxFromMask(mask, threshold = 0.5) {
  const { data, width, height } = mask
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[y * width + x] > threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null // pusta maska
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

// bbox z maski przeskalowany do pikseli obrazu (maska bywa innej rozdzielczości).
export function bboxFromMaskInImage(mask, imgW, imgH, threshold = 0.5) {
  const b = bboxFromMask(mask, threshold)
  if (!b) return null
  const sx = imgW / mask.width
  const sy = imgH / mask.height
  return { x: b.x * sx, y: b.y * sy, w: b.w * sx, h: b.h * sy }
}

// bbox z obrysu ręcznego (punkty znormalizowane 0..1).
export function bboxFromPoints(points, imgW, imgH) {
  if (!points || points.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    const x = p.x * imgW
    const y = p.y * imgH
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export function normalizeBox(box, imgW, imgH) {
  return { x: box.x / imgW, y: box.y / imgH, w: box.w / imgW, h: box.h / imgH }
}

export function denormalizeBox(box, imgW, imgH) {
  return { x: box.x * imgW, y: box.y * imgH, w: box.w * imgW, h: box.h * imgH }
}

// Środek bounding boxa znamienia (znormalizowany) — punkt kadrowania.
export function lesionCenterNorm({ mask, points, imgW, imgH }) {
  if (!imgW || !imgH) return null
  let bbox = null
  if (mask) bbox = bboxFromMaskInImage(mask, imgW, imgH)
  if ((!bbox || bbox.w <= 0 || bbox.h <= 0) && points && points.length >= 3) {
    bbox = bboxFromPoints(points, imgW, imgH)
  }
  if (!bbox || bbox.w <= 0 || bbox.h <= 0) return null
  return { x: (bbox.x + bbox.w / 2) / imgW, y: (bbox.y + bbox.h / 2) / imgH }
}

// Sugerowane pole widzenia (mm) z rozmiaru znamienia: 3x średnica (znamię ~1/3
// kadru), zaokrąglone do 5 mm, w granicach 15-120. Domyślny rozmiar dla UI.
export function suggestFovMm(diameterMm) {
  const value = 3 * diameterMm
  if (!Number.isFinite(value) || value <= 0) return 40
  const rounded = Math.round(value / 5) * 5
  return Math.min(120, Math.max(15, rounded))
}

// Kadr HYBRYDOWY: kwadrat o stałym polu widzenia (fovMm) wokół znamienia.
// Bok w px = fovMm * pxPerMm, więc jest niezależny od odległości zdjęcia
// (px/mm to kompensuje), a realna skala kadru jest STAŁA — widać wzrost.
export function mmCenteredCropBox({ center, pxPerMm, fovMm, imgW, imgH }) {
  if (!center || !pxPerMm || !fovMm || !imgW || !imgH) return null
  const maxSide = Math.min(imgW, imgH)
  const side = Math.max(1, Math.min(Math.round(fovMm * pxPerMm), maxSide))
  const cx = center.x * imgW
  const cy = center.y * imgH
  const x = Math.max(0, Math.min(cx - side / 2, imgW - side))
  const y = Math.max(0, Math.min(cy - side / 2, imgH - side))
  return normalizeBox({ x, y, w: side, h: side }, imgW, imgH)
}

// --- DOM: wycięcie kadru z obrazu (po kompresji, orientacja już znormalizowana).
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Nie udało się wczytać obrazu.'))
    img.src = url
  })
}

export async function cropImageToBlob(source, crop, type = 'image/webp', quality = 0.92) {
  const url = URL.createObjectURL(source)
  try {
    const img = await loadImage(url)
    const px = denormalizeBox(crop, img.naturalWidth, img.naturalHeight)
    const sw = Math.max(1, Math.round(px.w))
    const sh = Math.max(1, Math.round(px.h))
    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      img,
      Math.round(px.x),
      Math.round(px.y),
      sw,
      sh,
      0,
      0,
      sw,
      sh
    )
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
    if (!blob) throw new Error('Nie udało się wykadrować zdjęcia.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
