# 02 — Scenariusze smoke (18 testów)

Type: task
Status: resolved
Map: .scratch/e2e-smoke-testy/map.md

## Problem

Które ścieżki w ogóle warto objąć? Pełne pokrycie UI jest drogie i kruche przy
solo-projekcie — potrzebna jest krótka lista o najwyższym zwrocie.

## Answer

**Decyzja: 4 pliki, 18 testów, wyłącznie to, co psuje się najczęściej.**

- `e2e/auth.spec.js` (4) — brak sesji nie odsłania nawigacji/stopki; błędne dane
  → komunikat po polsku; poprawne logowanie → wybór osoby; wylogowanie.
- `e2e/person.spec.js` (4) — lista osób i wejście w osobę (adres `#/person/id`);
  dodanie osoby; zmiana nazwy przez menu `⋯`; usunięcie z potwierdzeniem
  (i sprawdzenie, że kaskada usuwa osobę z listy).
- `e2e/lesions.spec.js` (4) — auto-nazwa `Tył-1` vs nadpisana nazwa z kontekstem
  okolicy (`Tył · ...`); statusy i termin kontroli; wyszukiwanie i filtr
  statusu zapisywane w adresie; odświeżenie zachowuje filtr.
- `e2e/navigation.spec.js` (3) — piny znamion na mapie; zakładki zmieniają
  adres; nieznany adres pokazuje ekran wyboru osoby zamiast się wywalić.
- `e2e/ui.spec.js` (3) — ciemny motyw przeżywa odświeżenie; na 375×667 menu `⋯`
  mieści się w ekranie; pola logowania mają ≥44 px wysokości.

Pomocnicze: `e2e/support/app.js` (`openApp`, `loginAsDemo`, `openPerson`,
`openLesionList`) — testy czytają się jak scenariusz, nie jak selektory.

Uwaga zapisana w kodzie: **nie używamy `.check()`** na filtrach listy, bo React
Router v7 aktualizuje adres w `startTransition` i DOM nie zmienia się
synchronicznie. `click()` + asercja czekająca załatwia sprawę.

Wynik: `18 passed` w ~7 s; przy `--repeat-each=2` — `36 passed` (brak flaky).
