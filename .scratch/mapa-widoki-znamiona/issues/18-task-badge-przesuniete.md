# 18 — Badge `przesunięte` → `data ręcznie przesunięta`

Type: task
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Badge na karcie w widoku `Kontrole` doprecyzowuje, że chodzi o ręcznie
przesuniętą datę: `przesunięte` → `data ręcznie przesunięta`.

## Kryteria akceptacji

- [ ] Badge pokazuje `data ręcznie przesunięta` (zamiast `przesunięte`).
- [ ] Warunek wyświetlania bez zmian (`lesion.next_check_at` ustawione).
- [ ] Tooltip/`title` (jeśli dodany) wyjaśnia, że to ręczny termin, nie ocena.
- [ ] Forma zgodna z glosariuszem (`Termin kontroli`).

## Kontekst

- `src/components/Reminders.jsx` → `{snoozed ? <span …>przesunięte</span> : null}`.

## Comments

- W pełni rozstrzygnięte w „Decisions so far" — brak zależności.

## Answer

Zrealizowane. Badge `przesunięte` → `data ręcznie przesunięta`.
