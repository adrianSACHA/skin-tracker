# 03 — Lista: wyszukiwanie po nazwie/okolicy

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Przy kilkunastu znamionach trudno znaleźć konkretne — nie ma wyszukiwania.

## Propozycja

- Pole wyszukiwania nad listą (filtruje po nazwie i okolicy), stan w URL
  (spójnie z filtr/sort).
- Łączy się z filtrem po statusie (AND).

## Kryteria akceptacji

- [x] Wpisanie tekstu zawęża listę po nazwie/okolicy.
- [x] Fraza zapisana w URL i odtwarzana po odświeżeniu.
- [x] Puste pole = brak filtrowania.

## Answer

Zrealizowane: filterByQuery w lesionView (po nazwie i okolicy, bez wielkości
liter), parametr q w listParams (stan w URL), pole wyszukiwania na górze listy.
+5 testów.
