# 10 — Wdrożenie Wariantu B na mapie ciała

Type: task
Status: resolved
Blocked by: 04
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Nagłówek mapy ciała renderuje akcje kontekstowo, zgodnie z decyzją z ticketu 04:

- Brak widoków → tylko `+ Dodaj widok` (primary, duży).
- Są widoki → `+ Dodaj znamię` (primary) + `+ Dodaj widok` (secondary, mniejszy).

## Kryteria akceptacji

- [ ] W stanie pustym (brak widoków) widoczny jest wyłącznie `+ Dodaj widok`.
- [ ] Przy istniejących widokach `+ Dodaj znamię` jest primary, a `+ Dodaj widok`
      secondary (mniejszy).
- [ ] Kolejność zgodna z realnym flow: najpierw widok, potem znamię.
- [ ] Zachowane stany disabled/`title` (np. brak zdjęcia referencyjnego).
- [ ] Bez regresji a11y (`min-h-[44px]`, focus ring, `aria`).

## Kontekst

- Dziś oba przyciski (`+ Dodaj znamię`, `+ Dodaj widok`) renderują się razem,
  a `+ Dodaj widok` jest w pasku zakładek. Szczegóły wariantu → ticket 04.

## Comments

- Zablokowany przez 04 (prototyp Wariantu B).

## Answer

Zrealizowane. Nagłówek `BodyMap.jsx` renderuje akcje kontekstowo (Wariant B, patrz ticket 04).
