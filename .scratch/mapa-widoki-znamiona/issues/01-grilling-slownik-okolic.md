# 01 — Pełny słownik okolic ciała + zasady dodawania własnych

Type: grilling
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Jaka jest pełna lista predefiniowanych okolic ciała w dropdownie widoków i czy
użytkownik może usuwać predefiniowane pozycje, czy tylko dodawać własne?

Kontekst:

- Dziś `BodyMap.jsx` ma stałą `VIEWS` z 6 technicznymi kluczami
  (`front`, `back`, `left`, `right`, `legs_front`, `legs_back`) i etykietami
  („Przód", „Tył", „Bok lewy", „Bok prawy", „Nogi — przód", „Nogi — tył").
  To nie jest słownik okolic ciała, tylko zestaw zdjęć referencyjnych.
- Docelowo widok ma nazwę-okolicę (np. „Tył", „Plecy-prawa") i z niej wynika
  prefiks nazwy znamienia (np. `Tył-1`).
- Z mgły: „Czy użytkownik może usuwać predefiniowane okolice z dropdownu, czy
  tylko dodawać własne?"

Odpowiedź steruje ticketem 09 (dropdown widoków) i 08 (auto-nazwy znamion).

## Answer

Słownik predefiniowany (17 okolic) w `src/lib/bodyAreas.js`: Przód, Tył,
Bok lewy, Bok prawy, Nogi — przód, Nogi — tył, Kark, Twarz, Plecy — środek,
Ramię lewe, Ramię prawe, Dłoń lewa, Dłoń prawa, Noga lewa, Noga prawa,
Stopa lewa, Stopa prawa.

Predefiniowanych **nie usuwamy** — użytkownik może dodać własną okolicę
(wolny tekst, zapisany jako nazwa). Uzasadnienie: usuwanie chowałoby
pozycje i psuło prefiksy nazw znamion.

`body_maps.view_name` trzyma klucz słownika (np. `front`) albo własną nazwę
wprost (np. `Plecy prawa`) — stare rekordy działają dalej.
