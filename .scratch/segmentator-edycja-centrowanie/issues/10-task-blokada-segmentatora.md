# 10 — Blokada segmentatora bez skali

Type: task
Status: resolved
Blocked by: 04
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Co dostarcza

Pomiar z obrysu niedostępny, dopóki użytkownik nie potwierdzi skali w kadrze
(checkbox `hasScaleReference` w `PhotoUploadForm.jsx`) — zgodnie z wariantem
wybranym w `04` (ukryty / wyszarzony / komunikat).

## Kryteria akceptacji

- [x] Bez potwierdzonej skali pomiar z obrysu jest zablokowany (wg decyzji z `04`).
- [x] Etykieta „(opcjonalnie)" usunięta — pomiar nie jest opcjonalny, jeśli ma liczyć mm.
- [x] Komunikat jasno tłumaczy, dlaczego bez skali nic nie policzy (problem **B**).
- [x] Ścieżka ręcznego wpisania „Rozmiar (mm)" pozostaje jasno oddzielona od segmentatora.

## Comments

- Powstał z problemów **B** i **F**.
- Zablokowany przez `04`.
- Zrealizowane razem z ticketem 09 (`PhotoUploadForm.jsx`): przycisk „Pomiar z obrysu" `disabled` bez checkboxa `hasScaleReference` + wyjaśnienie obok; usunięte „(opcjonalnie)"; odznaczenie skali zamyka otwarty segmentator.
