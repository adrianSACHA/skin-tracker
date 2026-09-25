# 11 — Centrowanie znamienia w kadrze porównania

Type: task
Status: resolved
Blocked by: 05
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Co dostarcza

Znamię wycentrowane w kadrze porównania w `LesionDetail.jsx`. Dziś dwie warstwy
`object-contain` na `aspect-[3/4]` pokazują całe zdjęcie, przez co porównanie na
sliderze jest nieskuteczne. Rozwiązanie zgodne z `05` — auto na podstawie maski
(bounding box + padding) albo mocniejszy, ręczny kadr.

## Kryteria akceptacji

- [x] Porównanie na sliderze pokazuje znamię w centrum kadru.
- [x] Oba zdjęcia (A i B) kadrowane spójnie, by dawały się nałożyć.
- [x] Zachowany fallback, gdy brak maski (ręczny kadr / dotychczasowe zachowanie).

## Comments

- Powstał z problemu **G**.
- Zablokowany przez `05`.
- Zrealizowane: nowy `src/lib/crop.js` (czysta geometria + `cropImageToBlob`, 11 testów) liczy kwadratowy kadr z maski AI albo z obrysu ręcznego (padding 25%, clamp, fallback `null`). `uploadPhoto.js` stosuje kadr PO kompresji (orientacja EXIF już znormalizowana → kadr się nie obraca). `PhotoUploadForm.jsx` ma przełącznik „Wyśrodkuj kadr na znamieniu". `LesionDetail.jsx`: kadr porównania `aspect-square` + `object-cover`. `npm run build` + `npm test` (31) zielone.
