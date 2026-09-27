# 15 — Przeniesienie `← Mapa ciała` nad tytuł `Lista znamion`

Type: task
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Link `← Mapa ciała` na liście znamion staje się breadcrumbem nad tytułem
`Lista znamion`, zamiast być przyklejonym w prawym górnym rogu nagłówka.

## Kryteria akceptacji

- [ ] `← Mapa ciała` renderuje się **nad** `h1` „Lista znamion".
- [ ] Nagłówek przestaje używać `justify-between` tylko po to, by rozsunąć tytuł
      i link.
- [ ] Link zachowuje cel `/person/:personId` i styl focus ring.
- [ ] Bez zmian w pozostałych akcjach nagłówka.

## Kontekst

- `src/components/LesionsList.jsx` → nagłówek `flex … justify-between` z `h1`
  i `<Link>← Mapa ciała</Link>`.

## Comments

- W pełni rozstrzygnięte w „Decisions so far" — brak zależności.

## Answer

Zrealizowane. `LesionsList.jsx` — link `← Mapa ciała` nad `h1`.
