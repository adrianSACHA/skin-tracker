# 04 — Sortowanie po `Terminie kontroli`

Type: task
Status: ready-for-agent
Blocked by: 01, 02
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Kontrolka sortowania ustawia kolejność listy; domyślnie najpilniejsze `Terminy
kontroli` są na górze.

## Kryteria akceptacji

- [x] Lista sortuje się po `Terminie kontroli` rosnąco.
- [x] `Znamiona` bez terminu trafiają na koniec.
- [x] Przy równych terminach kolejność jest zdeterminowana (nie losowa).
- [x] Testy pokrywają sortowanie.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`. Wymaga 02, bo sortuje po spójnym terminie.
- Zrealizowane. `sortRowsByNext` w `lesionView` (rosnąco, bez terminu na koniec, tie-break po nazwie); kontrolka „Sortuj" w `LesionsList` z opcjami: Termin kontroli (domyślnie) / Status. 3 nowe testy.
