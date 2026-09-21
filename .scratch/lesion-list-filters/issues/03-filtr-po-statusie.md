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

- [ ] Zaznaczenie jednego lub kilku `Status` zawęża listę.
- [ ] Brak zaznaczeń = wszystkie znamiona.
- [ ] Widoczny licznik widocznych pozycji (np. „3 z 12").
- [ ] Stary checkbox nie dubluje się z filtrem.
- [ ] Nazwy statusów zgodne z `CONTEXT.md`.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`.
