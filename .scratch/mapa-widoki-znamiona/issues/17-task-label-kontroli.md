# 17 — `Przejdź do kontroli →` → `Zobacz kontrolę →`

Type: task
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Na karcie znamienia w liście etykieta linku zmienia się z
`Przejdź do kontroli →` na `Zobacz kontrolę →` (data już jest pokazana obok,
link nie „planuje" kontroli).

## Kryteria akceptacji

- [ ] Karta znamienia na liście ma link `Zobacz kontrolę →` (albo
      `Szczegóły kontroli →` — wybrać jedną formę i utrzymać spójnie).
- [ ] Cel linku bez zmian (`/person/:personId/reminders`).
- [ ] Forma spójna z resztą UI (bez zmian stylu/focus ring).

## Kontekst

- `src/components/LesionsList.jsx` → `<Link …>Przejdź do kontroli →</Link>`
  na końcu każdej karty.

## Comments

- W pełni rozstrzygnięte w „Decisions so far" — brak zależności.
- Do wyboru jedna z dwóch propozycji etykiety; domyślnie `Zobacz kontrolę →`.

## Answer

Zrealizowane. `Przejdź do kontroli →` → `Zobacz kontrolę →`.
