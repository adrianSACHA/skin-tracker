// Geometria kadru centrującego znamię (decyzje 05 + ticket 11).
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

// Kwadratowy kadr wokół boxa (piksele), z paddingiem, przycięty do obrazu.
export function squareCropBoxPx(box, imgW, imgH, padding = 0.25) {
  const maxSide = Math.min(imgW, imgH)
  const side = Math.min(maxSide, Math.max(box.w, box.h) * (1 + padding))
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  const x = Math.max(0, Math.min(cx - side / 2, imgW - side))
  const y = Math.max(0, Math.min(cy - side / 2, imgH - side))
  return { x: Math.round(x), y: Math.round(y), w: Math.round(side), h: Math.round(side) }
}

export function normalizeBox(box, imgW, imgH) {
  return { x: box.x / imgW, y: box.y / imgH, w: box.w / imgW, h: box.h / imgH }
}

export function denormalizeBox(box, imgW, imgH) {
  return { x: box.x * imgW, y: box.y * imgH, w: box.w * imgW, h: box.h * imgH }
}

// Złożenie: z maski (AI) albo obrysu ręcznego -> znormalizowany kwadratowy kadr.
// Zwraca null, gdy nie ma czego kadrować (pusta maska / brak obrysu).
//
// Kadr liczymy OD ZNAMIENIA: bok = (1 + padding) x większy wymiar bounding boxa.
// Dzięki temu jest NIEZALEŻNY od odległości zdjęcia - czy zrobisz je bliżej, czy
// dalej, znamię zajmuje w kadrze tę samą część, więc dwa zdjęcia da się nałożyć.
// (Cena: realny wzrost/ubytek nie będzie "widoczny" na nakładce - do tego jest
// liczba mm i wykres trendu.)
//
// padding 2.0 => bok = 3x bounding box (znamię ~1/3 kadru + margines).
// minSidePx => tylko zabezpieczenie przed degeneratem (bardzo mały bok).
export function centeredCropBox({
  mask,
  points,
  imgW,
  imgH,
  padding = 2.0,
  minSidePx = 64,
}) {
  if (!imgW || !imgH) return null
  let bbox = null
  if (mask) bbox = bboxFromMaskInImage(mask, imgW, imgH)
  if ((!bbox || bbox.w <= 0 || bbox.h <= 0) && points && points.length >= 3) {
    bbox = bboxFromPoints(points, imgW, imgH)
  }
  if (!bbox || bbox.w <= 0 || bbox.h <= 0) return null

  const px = squareCropBoxPx(bbox, imgW, imgH, padding)

  // Zabezpieczenie: skrajnie mały bok -> rozszerz do minSidePx (środek bez zmian).
  const side = Math.max(px.w, Math.min(minSidePx, Math.min(imgW, imgH)))
  if (side !== px.w) {
    const cx = px.x + px.w / 2
    const cy = px.y + px.h / 2
    const x = Math.max(0, Math.min(cx - side / 2, imgW - side))
    const y = Math.max(0, Math.min(cy - side / 2, imgH - side))
    return normalizeBox({ x, y, w: side, h: side }, imgW, imgH)
  }
  return normalizeBox(px, imgW, imgH)
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
