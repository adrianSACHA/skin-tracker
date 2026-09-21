# 03 — Filtr po `Status`

Type: task
Status: ready-for-agent
Blocked by: 01
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Pasek filtrów pozwala zawęzić listę do wybranych `Status` (wielokrotny wybór).
Bez wyboru widać wszystkie znamiona. Obok widnieje licznik „X z Y". Domyślny
checkbox „tylko do obserwacji i pilne" zostaje wchłonięty przez filtr.

## Kryteria akceptacji

- [x] Zaznaczenie jednego lub kilku `Status` zawęża listę.
- [x] Brak zaznaczeń = wszystkie znamiona.
- [x] Widoczny licznik widocznych pozycji (np. „3 z 12").
- [x] Stary checkbox nie dubluje się z filtrem.
- [x] Nazwy statusów zgodne z `CONTEXT.md`.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`.
- Zrealizowane. `LesionsList` ma pasek filtra (chipy per status z kolorami z `statusMeta`), licznik „X z Y", przycisk „Wyczyść"; stary checkbox usunięty. Logika filtra siedzi w `filterByStatus` (już pokryta testami).
