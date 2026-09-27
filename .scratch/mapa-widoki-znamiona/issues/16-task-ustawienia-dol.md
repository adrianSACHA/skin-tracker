# 16 — Przeniesienie ustawień na dół widoku `Kontrole`

Type: task
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

W widoku `Kontrole` ustawienia (`Przypomnij`, `Interwał kontroli`) przenoszą się
na dół — najpierw treść (lista znamion / kontrole), potem konfiguracja.

## Kryteria akceptacji

- [ ] Blok ustawień („Przypomnij", „Interwał kontroli") jest **poniżej** listy.
- [ ] Pasek podsumowania (`Zaległe` / `W ciągu 30 dni`) i lista pozostają na górze.
- [ ] Kolejność: nagłówek → (ew. błąd) → podsumowanie → lista → ustawienia.
- [ ] Bez zmian funkcjonalnych (te same wartości, ten sam zapis `onBlur`).

## Kontekst

- `src/components/Reminders.jsx` → blok „Ustawienia przypomnień" jest dziś
  zaraz po nagłówku, przed paskiem podsumowania i listą.

## Comments

- W pełni rozstrzygnięte w „Decisions so far" — brak zależności.

## Answer

Zrealizowane. Blok ustawień w `Reminders.jsx` przeniesiony pod listę (nagłówek → podsumowanie → lista → ustawienia).
