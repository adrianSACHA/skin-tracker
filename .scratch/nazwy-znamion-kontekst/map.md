# Wayfinder: Kontekst okolicy w nazwie znamienia

Effort: `.scratch/nazwy-znamion-kontekst/`
Tickets: `.scratch/nazwy-znamion-kontekst/issues/`

## Destination

Rozstrzygnąć dwie kwestie odłożone przy zamykaniu effortu
`mapa-widoki-znamiona` (sekcja „Not yet specified"):

- Czy po **ręcznym nadpisaniu** nazwy znamienia pokazywać jeszcze okolicę ciała
  (kontekst, gdzie to jest).
- Jak pokazywać nazwę na **liście znamion** (prefiks + opis czy sam opis).

## Decisions so far

- Pochodzi z `mapa-widoki-znamiona`: nazwy znamion auto-generowane jako
  `Prefiks-N` (np. `Tył-3`), użytkownik może nadpisać. Dziś nadpisana nazwa jest
  używana wprost, bez doklejania prefiksu.
- Prefiks jest **niezmienny** — zmiana nazwy widoku nie przepisuje
  `lesions.label` (ticket 02 tamtego effortu).
- **Kontekst okolicy (01/02):** po nadpisaniu nazwy znamienia pokazujemy okolicę
  obok (`Tył · znamię przy łopatce`), braną **dynamicznie** z widoku znamienia.
  Auto-nazwy (`Tył-3`) bez zmian. Dotyczy listy, panelu pina i szczegółów.
  → `issues/01-…`, `issues/02-…`

## Not yet specified (mgła)

Rozstrzygnięte przez tickety 01–02 poniżej.

## Out of scope

- Zmiana schematu Supabase (bez nowych pól/tabel — ewentualny kontekst liczymy
  z istniejącego `lesions.body_map_id → body_maps.view_name`).

## Tickets

| #  | Type     | Tytuł                                                             | Blocked by | Status |
| -- | -------- | ----------------------------------------------------------------- | ---------- | ------ |
| 01 | grilling | [Okolica po nadpisaniu nazwy znamienia](issues/01-grilling-okolica-po-nadpisaniu.md) | — | resolved |
| 02 | grilling | [Lista: prefiks + opis czy sam opis](issues/02-grilling-lista-prefiks.md) | 01 | resolved |

## Frontier

Brak — oba tickety `resolved`. Wdrożone w `src/lib/bodyAreas.js`,
`src/components/LesionName.jsx` (+ `LesionsList`, `Reminders`,
`LesionDetail`, `LesionInfoPanel`) oraz poprawka constraintu w
`supabase/rls-setup.sql`.
