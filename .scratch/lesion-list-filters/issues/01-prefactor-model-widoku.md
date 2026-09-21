# 01 — Prefactor: model widoku listy + testy

Type: task
Status: ready-for-agent
Blocked by: brak
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Jedno, czyste miejsce liczy widok listy znamion — ostatnie zdjęcie, `Termin
kontroli` i zaległość — oraz filtrowanie i sortowanie. Dzięki temu kolejne
tickety zmieniają zachowanie w jednym punkcie, a nie w dwóch komponentach.
Duplikat `lastPhotoDate` (dziś w `LesionsList` i `Reminders`) znika, a logika
jest pokryta testami jednostkowymi.

## Kryteria akceptacji

- [x] Działa runner testów (`npm test`) skonfigurowany pod Vite/React.
- [x] Powstaje czysty moduł (bez JSX) liczący `last`, `Termin kontroli`, `overdue` oraz udostępniający `filterByStatus` i `sortRows`.
- [x] `LesionsList` i `Reminders` korzystają z tego modułu — duplikat `lastPhotoDate` usunięty.
- [x] Testy pokrywają: brak zdjęć, jedno zdjęcie, wiele zdjęć, sortowanie.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`.
- Zrealizowane. Vitest 2.1.9 (Vite 5 wymaga <3), `src/lib/lesionView.js` + `lesionView.test.js` (14 testów), `daysBetween` w `date.js`. Zachowanie zachowane: `LesionsList` nadal używa `nextComputed`, `Reminders` `nextEffective` — ujednolicenie należy do ticketu 02.
