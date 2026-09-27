# 04 — Wariant B: kontekstowe renderowanie przycisków na mapie ciała

Type: prototype
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Jak dokładnie wygląda Wariant B (kontekstowe renderowanie) w nagłówku mapy
ciała, w obu stanach?

Ustalone w „Decisions so far":

- **Brak widoków** → tylko `+ Dodaj widok` (primary, duży).
- **Są widoki** → `+ Dodaj znamię` (primary) + `+ Dodaj widok` (secondary,
  mniejszy).

Do rozstrzygnięcia w prototypie:

- Czy „Dodaj widok" przy istniejących widokach zostaje przycisk w pasku
  zakładek, czy przenosi się do nagłówka obok `+ Dodaj znamię`?
- Jak wygląda stan pusty (brak widoków): czy `+ Dodaj znamię` i akcje tła są
  w ogóle ukryte, czy wyszarzone z wyjaśnieniem (spójność ze wzorcem
  „wyszarzony + wyjaśnienie" z mapy 001)?
- Relacja do menu `⋯` (ticket 05) — kolejność elementów w nagłówku.

Kontekst: dziś `+ Dodaj znamię` / `Zmień zdjęcie tła` / `Usuń zdjęcie tła` są
renderowane bezwarunkowo obok siebie; `+ Dodaj widok` siedzi w pasku zakładek.

Odpowiedź steruje ticketem 10.

## Answer

Wariant B (wdrożony):

- **Brak widoków** → nagłówek pokazuje tylko `+ Dodaj widok` (primary,
  duży: `min-h-[52px]`, `text-base`); brak `+ Dodaj znamię` i brak menu `⋯`.
- **Są widoki** → `+ Dodaj znamię` (primary) + `+ Dodaj widok` (secondary,
  mniejszy) + menu `⋯`.

Panel „+ Dodaj widok" (okolica + własna nazwa + „Wgraj zdjęcie") renderuje
się pod nagłówkiem; w pasku zakładek zostają same widoki z tłem.
