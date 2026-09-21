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

- [ ] Działa runner testów (`npm test`) skonfigurowany pod Vite/React.
- [ ] Powstaje czysty moduł (bez JSX) liczący `last`, `Termin kontroli`, `overdue` oraz udostępniający `filterByStatus` i `sortRows`.
- [ ] `LesionsList` i `Reminders` korzystają z tego modułu — duplikat `lastPhotoDate` usunięty.
- [ ] Testy pokrywają: brak zdjęć, jedno zdjęcie, wiele zdjęć, sortowanie.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`.
