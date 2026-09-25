# 08 — Edycja zdjęcia (obrót, flip, reset, ew. crop)

Type: task
Status: resolved
Blocked by: 01
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Co dostarcza

Po wybraniu zdjęcia w formularzu nowego zdjęcia (`PhotoUploadForm.jsx`) —
możliwość edycji przed wysłaniem: obrót, odbicie (flip) i reset; zakres „crop"
zgodnie z decyzją z `01`.

## Kryteria akceptacji

- [x] Po wybraniu zdjęcia widać podgląd z akcjami edycji (obrót / flip / reset, ew. crop).
- [x] Edycja działa przed kompresją i wysłaniem; wynik (nie oryginał) trafia do uploadu.
- [x] „Reset" przywraca stan surowy zdjęcia.
- [x] Orientacja EXIF z `browser-image-compression` nie jest psuta.
- [x] Obsługa dotyku i klawiatury (Chrome/Android).

## Comments

- Powstał z problemu **A** (brak edycji zdjęcia) i dosłownego feedbacku użytkownika.
- Zablokowany przez `01` (wybór podejścia do cropa).
- Zrealizowane: nowy `src/lib/editImage.js` (obrót 0/90/180/270 + odbicia na `<canvas>`, decyzja 01 — bez nowej zależności). `PhotoUploadForm.jsx`: pasek edycji (obróć w lewo/prawo, odbij w poziomie/pionie, reset) przy podglądzie; edycja przeliczana na plik roboczy, który trafia do uploadu ORAZ do segmentatora (spójny kadr). Interaktywny crop pominięty — kadrowanie robi segmentator (ticket 11). `npm run build` + `npm test` (31) zielone.
