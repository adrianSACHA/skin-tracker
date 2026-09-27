# 09 — Dropdown widoków: dodawanie i edycja nazw

Type: task
Status: resolved
Blocked by: 01
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Dropdown okolic ciała przy dodawaniu widoku korzysta ze słownika (ticket 01) i
pozwala dodać własną nazwę oraz zmienić nazwę istniejącego widoku.

## Kryteria akceptacji

- [ ] Dropdown „Nowy widok" wypełniony predefiniowanymi okolicami ze słownika.
- [ ] Można dodać własną nazwę okolicy (nie tylko wybrać z listy) — zgodnie
      z zasadami z ticketu 01 (usuwanie predefiniowanych?).
- [ ] Istniejący widok można przemianować (prefill + zapis nowej nazwy).
- [ ] Zmiana nazwy widoku nie gubi przypisanych znamion (te same `body_map_id`).
- [ ] Etykieta widoku w pasku zakładek pokazuje nazwę ze słownika.

## Kontekst

- `BodyMap.jsx` → `VIEWS` (stała), `<select id="add-view">` z `viewsToAdd`,
  etykiety zakładek z `VIEWS.find(...).label`; `body_maps.view_name` trzyma klucz.
- Do rozstrzygnięcia razem z 01: czy `view_name` nadal trzyma techniczny klucz,
  czy nazwę okolicy; czy potrzebne nowe pole/tabela słownika.

## Comments

- Zablokowany przez 01 (słownik okolic).

## Answer

Zrealizowane. `BODY_AREAS`; dropdown „Nowy widok" ma opcję „Inna okolica (własna nazwa)…", a modal ustawień widoku pozwala przemianować. `view_name` = klucz słownika lub własna nazwa.
