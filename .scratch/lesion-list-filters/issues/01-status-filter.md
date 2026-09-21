# 01 — Filtr po statusie

Type: task
Status: ready-for-agent

## Zadanie

Dodać do `LesionsList` pasek filtrów pozwalający zawęzić listę po `status`
(`new`, `stable`, `watch`, `removed`, `urgent`) — wielokrotny wybór.

## Kryteria akceptacji

- [ ] Zaznaczenie jednego lub więcej `status` filtruje listę.
- [ ] Brak zaznaczeń = wszystkie znamiona.
- [ ] Przy pasku widnieje licznik widocznych pozycji (np. „3 z 12").

## Seam

Stan filtra trzymany lokalnie w `LesionsList` (`useState`). Bez zmian w bazie
i bez zmian w `LesionDetail`.

## Comments

- Utworzone przy setupie jako przykład konwencji `.scratch/`.
