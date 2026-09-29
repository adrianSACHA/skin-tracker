# 13 — Chrom aplikacji zjada ~600 px każdego ekranu

Type: task
Status: needs-triage
Map: .scratch/backlog/map.md

## Problem

Wyszło przy okazji ticketu 12 (ekran znamienia). Po podzieleniu treści na
zakładki okazało się, że **największym kosztem nie jest treść, a stały chrom
aplikacji** — ten sam na każdym ekranie.

Rozbiór ekranu znamienia na 375×667 (iPhone SE), zakładka „Przegląd”:

| Element | Wysokość |
| --- | --- |
| Nagłówek Layoutu (logo, osoba, motyw, wyloguj) | 69 px |
| Stopka Layoutu (zastrzeżenie „nie diagnozuje”) | **107 px** |
| Padding `main` (góra + dół) | 48 px |
| Powrót + tytuł + plakietka + linia meta | ~176 px |
| Rząd akcji („+ Dodaj zdjęcie”, „Do kalendarza”) | ~76 px |
| Pasek zakładek | ~76 px |
| Zastrzeżenie o statusach w treści | ~56 px |
| **Chrom razem** | **~600 px** |
| Treść zakładki „Przegląd” | 499 px |
| **Strona razem** | **1096 px** |

Czyli **55% wysokości to chrom, nie dokumentacja**. Uwaga: nagłówek zmierzono
bez paska zakładek (69 px), bo wejście bezpośrednio w adres znamienia nie ma
ustawionej osoby. Przy nawigacji widocznej (121 px) chrom rośnie do ~650 px.

## Kandydaci (do decyzji)

- **Stopka Layoutu (107 px).** Największy pojedynczy element i powtarza się na
  każdym ekranie — trzy linie drobnego tekstu z dużym paddingiem. Kandydat:
  skrócić do dwóch linii i zmniejszyć padding. **Treść zastrzeżenia zostaje**
  (zasada z ADR-0001: aplikacja nie diagnozuje).
- **Zastrzeżenie o statusach w treści ekranu znamienia (~56 px).** Powtarza to,
  co i tak mówi stopka Layoutu oraz lista znamion.
- **Rząd akcji (~76 px).** „+ Dodaj zdjęcie” mogłoby wejść do wiersza nagłówka
  obok `⋯` (tak jak `⋯` na karcie osoby) — mniej pasa ruchu.
- **Powrót + tytuł (~176 px).** Powrót jako strzałka w linii tytułu zamiast
  osobnego wiersza.

## Wniosek z ticketu 09 (nawigacja)

Dolny pasek nawigacji **nie zmniejsza** chromu — przenosi te same ~52 px z góry
na dół. Jeśli celem jest mniej chromu, właściwym adresem jest ta lista, a nie
przestawianie nawigacji.

## Pomiar

Rozszerzyć `e2e/ui-budget.spec.js` o budżet na sam chrom (np. suma wysokości
nagłówka i stopki), żeby nie wrócił niezauważony.
