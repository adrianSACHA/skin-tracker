# 08 — Auto-generowanie nazw znamion z prefiksu + numer

Type: task
Status: resolved
Blocked by: 01, 02
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Nowe znamię dostaje domyślną nazwę `Prefiks-N` (np. `Tył-1`, `Plecy-prawa-1`),
gdzie prefiks pochodzi z okolicy ciała widoku, a `N` to kolejny numer w tym
widoku. Użytkownik może nazwę nadpisać w formularzu.

## Kryteria akceptacji

- [ ] Formularz nowego znamienia podpowiada `Prefiks-N` (prefill) zamiast
      pustego pola.
- [ ] Numer `N` = 1 + najwyższy istniejący numer z tym prefiksem w danym
      widoku (bez duplikatów; nie „liczba znamion + 1").
- [ ] Nazwę można nadpisać ręcznie; pusta = zachowanie prefiksu/klikalna walidacja.
- [ ] Prefiks po zmianie nazwy widoku zachowuje się zgodnie z decyzją z ticketu 02.
- [ ] Brak regresu: `lesions.label` nadal płaski string (bez zmian schematu).

## Kontekst

- `BodyMap.jsx` → `savePending()` wstawia `label: pending.label.trim()`
  (input użytkownika), obok `pos_x`/`pos_y`/`status: 'new'`.
- Slownik okolic i jego zasady → ticket 01; prefiks po zmianie nazwy → ticket 02.

## Comments

- Zablokowany przez 01 (słownik) i 02 (zachowanie prefiksu).

## Answer

Zrealizowane. `src/lib/bodyAreas.js` → `nextLesionLabel` (1 + najwyższy numer dla prefiksu). Formularz nowego znamienia w `BodyMap.jsx` prefilluje nazwę. 19 testów w `bodyAreas.test.js`.
