# 04 — Kontrole: przeładowany rząd akcji na karcie

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Na karcie Kontroli jest 3-4 kontrolki: "Dodaj zdjęcie", select + "Przesuń",
(czasem) "Przywróć wyliczoną", "Do kalendarza". Na telefonie zawijają się do
kilku linii i rozpraszają.

## Propozycja

- Zostawić jako główną akcję **"Dodaj zdjęcie"**.
- Resztę schować w menu **"⋯"**: "Przesuń o N tyg.", "Do kalendarza", ewentualnie
  "Przywróć wyliczoną".
- Na karcie pokazać tylko najważniejszą informację (termin + ile dni).

## Kryteria akceptacji

- [x] Karta ma 1 wyraźną akcję + menu "⋯" (spójne z mapą ciała).
- [x] Wszystkie dotychczasowe akcje dostępne.
- [x] Na telefonie karta zajmuje mniej miejsca.

## Answer

Menu „⋯" wyodrębnione do wspólnego komponentu (src/components/OverflowMenu.jsx,
używanego też na mapie). Karta Kontroli: **Dodaj zdjęcie** + **Do kalendarza**
+ **⋯** (w menu: „Przesuń o N tyg." dla typowych wartości oraz „Przywróć
wyliczoną datę", gdy termin przesunięty). Usunięto inline SnoozeControl.
