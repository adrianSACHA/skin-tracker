# 05 — Stan filtra i sortowania w URL

Type: task
Status: ready-for-agent
Blocked by: 03, 04
Spec: .scratch/lesion-list-filters/spec.md

## Co dostarcza

Wybrany filtr i sortowanie zapisują się w hash URL i wracają po odświeżeniu oraz
po powrocie z widoku znamienia.

## Kryteria akceptacji

- [x] Wybrany filtr trafia do URL.
- [x] Sortowanie trafia do URL.
- [x] Odświeżenie (F5) odtwarza stan filtra i sortowania.
- [x] Wejście w `Znamię` i powrót zachowuje stan.
- [x] Niepoprawne parametry w URL nie psują widoku.

## Comments

- Zlecone przez `/to-tickets` z `spec.md`.
- Zrealizowane. Stan żyje w URL (`?status=watch,urgent&sort=status`) przez `useSearchParams` + `setSearchParams(..., { replace: true })`, więc odświeżenie i powrót działają „z konstrukcji" (URL = jedyne źródło prawdy). Parsowanie/budowa w `src/lib/listParams.js`, 7 testów (m.in. wadliwe parametry nie psują widoku). Kryteria 3-4 nie mają testu automatycznego (brak harnessu przeglądarkowego) — wynikają z konstrukcji.
