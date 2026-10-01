# 02 — Tytuł strony bez powtarzania zakładki

Type: task
Status: resolved
Map: .scratch/naglowek-kontekst/map.md

## Problem

Będąc w zakładce `Mapa`, strona pokazywała `h1` „Mapa ciała — Ja" — czyli
nazwa sekcji leciała **dwa razy** (aktywna zakładka w nagłówku + tytuł treści).
To samo na Kontrolach (`Kontrole` vs `Kontrole — Ja`). Właściciel:
„jestem w zakładce Mapa i w nagłówku jest napisane Mapa - Ja".

## Co dostarcza

Sekcję nazywa wyłącznie zakładka; tytuł strony przestaje ją powtarzać.

## Kryteria akceptacji

- [x] `Mapa ciała — Ja` / `Kontrole — Ja` nie jest widoczne jako duplikat
      zakładki.
- [x] Strona zachowuje `h1` (wymóg dostępności i testów) — ale jako `sr-only`.
- [x] Podtytuły ekranów bez zmian („Kliknij pin, aby otworzyć szczegóły
      znamienia." / „Kiedy zaplanować kolejną kontrolę…").

## Kontekst

- `src/components/BodyMap.jsx` — `h1` „Mapa ciała{ — <osoba>}".
- `src/components/Reminders.jsx` — `h1` „Kontrole{ — <osoba>}".

## Comments

- Nazwa osoby zostaje w tytule dla czytników ekranu — wizualnie pokazuje ją
  przycisk `Ja ▾` w nagłówku (ticket 01). Dzięki temu nie ma wizualnie ani
  powtórzonej sekcji, ani powtórzonej osoby.

## Answer

Zrealizowane: `h1` w `BodyMap.jsx` i `Reminders.jsx` zmienione na
`className="sr-only"` z zachowaną treścią. Widocznego tytułu nie ma — sekcję
nazywa aktywna zakładka, a kontekst osoby niesie przycisk `Ja ▾`.

**Dlaczego nie usuwamy `h1`:** czytniki ekranu potrzebują nagłówka poziomu 1,
a testy nawigacji pytają o `heading` po nazwie (`Mapa ciała — Ja`,
`/^Kontrole/`) — treść bez zmian, więc testy i axe-core (`a11y.spec.js`)
przechodzą bez modyfikacji.

Zrzuty ekranu przegenerowane (`npm run e2e:visual:update`).
