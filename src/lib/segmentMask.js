// MediaPipe InteractiveSegmenter bywa zwraca maskę ODWROCONĄ (tło zamiast
// obiektu pod promptem) — źródło objawu „mierzy wszystko poza klikniętym
// miejscem". Użytkownik kliknął W znamieniu, więc piksel kliknięcia MUSI
// należeć do maski; jeśli nie należy, odwracamy polaryzację.
//
// Funkcje czyste — testowalne bez DOM i bez MediaPipe.

// Wartość maski pod punktem (współrzędne znormalizowane 0..1).
export function maskValueAt(data, width, height, x, y) {
  const xi = Math.min(width - 1, Math.max(0, Math.round(x * width)))
  const yi = Math.min(height - 1, Math.max(0, Math.round(y * height)))
  return data[yi * width + xi]
}

// Zwraca maskę pewną co do polaryzacji: punkt(y) promptu muszą być w masce.
// Gdy pierwszy punkt wypada poza maską, zwraca maskę odwróconą (1 - v).
export function correctMaskPolarity(data, width, height, seeds, threshold = 0.5) {
  if (!seeds || seeds.length === 0) return data
  const seed = seeds[0]
  if (maskValueAt(data, width, height, seed.x, seed.y) > threshold) return data
  const out = Float32Array.from(data)
  for (let i = 0; i < out.length; i += 1) out[i] = 1 - out[i]
  return out
}
