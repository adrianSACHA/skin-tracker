// Edycja zdjęcia: obrót (0/90/180/270) i odbicia — własny helper na <canvas>.
// Decyzja 01: bez nowej zależności. Interaktywny cropper pominięty, bo kadrowanie
// robi segmentator (ticket 11); tutaj zostaje obrót/flip/reset.

export function isIdentityEdit({ rotate = 0, flipH = false, flipV = false } = {}) {
  return rotate === 0 && !flipH && !flipV
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Nie udało się wczytać obrazu.'))
    img.src = url
  })
}

// Zwraca Blob po obrocie/odbiciach. W Chrome drawImage respektuje orientację EXIF,
// więc wynik jest już zorientowany wizualnie (jak podgląd w <img>).
export async function applyEdit(source, edit, type = 'image/webp', quality = 0.92) {
  const { rotate = 0, flipH = false, flipV = false } = edit || {}
  const url = URL.createObjectURL(source)
  try {
    const img = await loadImage(url)
    const w = img.naturalWidth
    const h = img.naturalHeight
    const swap = rotate === 90 || rotate === 270
    const canvas = document.createElement('canvas')
    canvas.width = swap ? h : w
    canvas.height = swap ? w : h
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.drawImage(img, -w / 2, -h / 2)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
    if (!blob) throw new Error('Nie udało się przetworzyć zdjęcia.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
