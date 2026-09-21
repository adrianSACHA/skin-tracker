# 05 — Stan filtra i sortowania w URL

Type: task
Status: ready-for-agent
Blocked by: 03, 04
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Wybrany filtr i sortowanie zapisują się w hash URL i wracają po odświeżeniu oraz
po powrocie z widoku znamienia.

## Kryteria akceptacji

- [ ] Wybrany filtr trafia do URL.
- [ ] Sortowanie trafia do URL.
- [ ] Odświeżenie (F5) odtwarza stan filtra i sortowania.
- [ ] Wejście w `Znamię` i powrót zachowuje stan.
- [ ] Niepoprawne parametry w URL nie psują widoku.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`.
