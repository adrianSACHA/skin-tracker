# 04 — Sortowanie po `Terminie kontroli`

Type: task
Status: ready-for-agent
Blocked by: 01, 02
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Kontrolka sortowania ustawia kolejność listy; domyślnie najpilniejsze `Terminy
kontroli` są na górze.

## Kryteria akceptacji

- [ ] Lista sortuje się po `Terminie kontroli` rosnąco.
- [ ] `Znamiona` bez terminu trafiają na koniec.
- [ ] Przy równych terminach kolejność jest zdeterminowana (nie losowa).
- [ ] Testy pokrywają sortowanie.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`. Wymaga 02, bo sortuje po spójnym terminie.
