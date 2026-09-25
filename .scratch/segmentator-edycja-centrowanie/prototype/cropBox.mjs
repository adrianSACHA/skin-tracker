// Prototyp (research/decisions tylko): wyliczenie kadru centrującego znamie.
// Czysta geometria - bez DOM, bez MediaPipe. Uruchom: `node cropBox.mjs`
//
// Punkt wyjscia to dane, ktore LesionSegmenter juz liczy:
//   - maska: { data: Float32Array, width, height }  (segmentacja AI)
//   - manualPoints: [{x,y}] w jedn. znormalizowanych (obrys reczny)

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

export function bboxFromPoints(points, imgW, imgH) {
  if (!points || points.length === 0) return null
  let minX = imgW
  let minY = imgH
  let maxX = -1
  let maxY = -1
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

// Kadr KWADRATOWY wokol boxa, z paddingiem, przyciety do granic obrazu.
// Kwadrat = stabilne, latwe do nalorzenia kadry miedzy zdjeciami w porownaniu.
export function squareCropBox(box, imgW, imgH, padding = 0.25) {
  const maxSide = Math.min(imgW, imgH)
  const side = Math.min(maxSide, Math.max(box.w, box.h) * (1 + padding))
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2
  let x = cx - side / 2
  let y = cy - side / 2
  x = Math.max(0, Math.min(x, imgW - side))
  y = Math.max(0, Math.min(y, imgH - side))
  return { x: Math.round(x), y: Math.round(y), w: Math.round(side), h: Math.round(side) }
}

// --- Demo + mini-asserty (dowod, ze logika dziala) ---
function makeMask(width, height, blob) {
  const data = new Float32Array(width * height)
  for (let y = blob.y; y < blob.y + blob.h; y += 1) {
    for (let x = blob.x; x < blob.x + blob.w; x += 1) data[y * width + x] = 0.9
  }
  return { data, width, height }
}

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL: ' + msg)
    process.exit(1)
  }
}

// 1) bbox z maski (blob 40x20 w lewym gornym rogu, obraz 200x150)
const mask = makeMask(200, 150, { x: 10, y: 12, w: 40, h: 20 })
const b = bboxFromMask(mask)
assert(b && b.x === 10 && b.y === 12 && b.w === 40 && b.h === 20, 'bbox z maski')
console.log('bbox(mask) =', b)

// 2) kadr kwadratowy 25% paddingu -> side = max(40,20)*1.25 = 50
const box = squareCropBox(b, 200, 150, 0.25)
assert(box.w === 50 && box.h === 50, 'kwadrat 50')
assert(box.x >= 0 && box.y >= 0 && box.x + box.w <= 200 && box.y + box.h <= 150, 'clamp')
console.log('crop(square) =', box)

// 3) przy krawedzi kadr nie wychodzi za obraz i zachowuje kwadrat
const edge = squareCropBox({ x: 0, y: 0, w: 30, h: 30 }, 100, 100, 0.2)
assert(edge.x === 0 && edge.y === 0 && edge.w === edge.h, 'krawedz + kwadrat')
console.log('crop(edge)   =', edge)

// 4) pusta maska -> null (fallback: brak auto-kadru)
assert(bboxFromMask(makeMask(50, 50, { x: 0, y: 0, w: 0, h: 0 })) === null, 'pusta maska')
console.log('pusta maska  -> null (fallback)')

// 5) obrys reczny -> ten sam mechanizm bbox
const pb = bboxFromPoints([{ x: 0.6, y: 0.5 }, { x: 0.8, y: 0.7 }, { x: 0.7, y: 0.9 }], 300, 200)
assert(pb && pb.x === 180 && pb.y === 100 && pb.w === 60 && pb.h === 80, 'bbox z punktow')
console.log('bbox(points) =', pb)

console.log('\nOK - wszystkie asserty przeszly')
