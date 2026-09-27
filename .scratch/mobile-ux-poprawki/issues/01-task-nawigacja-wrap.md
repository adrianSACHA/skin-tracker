# 01 — Nawigacja: zawijanie (badge nie rozpycha)

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Nawigacja (`Mapa ciała` / `Lista znamion` / `Kontrole`) plus nowy licznik przy
„Kontrole" nie mogą rozpychać ekranu w poziomie na wąskim telefonie.

## Kryteria akceptacji

- [x] `nav` ma `flex-wrap` — przy braku miejsca linki zawijają się, zamiast
      powodować poziome przewijanie.
- [x] Nagłówek również `flex-wrap` (logo + akcje nie rozpychają ekranu).

## Answer

Zrealizowane w `src/components/Layout.jsx`: dodane `flex-wrap` do nagłówka i do
`nav`.
