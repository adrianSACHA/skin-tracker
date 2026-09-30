# 13 — Chrom aplikacji zjada ~600 px każdego ekranu

Type: task
Status: resolved
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

## Answer (2026-09-29)

### Korekta samego ticketu

Ticket szacował chrom na ~600 px. Po dokładnym pomiarze (375×667, karta
znamienia, który to pomiar odróżniał chrom od **treści ekranu**) stały chrom
to **276 px**: nagłówek 121 + stopka 107 + paddingi `main` 48. Reszta z tych
"600 px" to elementy treści konkretnego ekranu (powrót, tytuł, akcje, pasek
zakładek), a nie wspólny koszt. To rozróżnienie zmieniło priorytety.

### Co zostało zrobione

| Element | Przed | Po |
| --- | --- | --- |
| Stopka Layoutu | 107 px | **54 px** |
| Nagłówek (padding wiersza) | 121 px | **113 px** |
| Paddingi `main` | 48 px | **32 px** |
| **Stały chrom razem** | **276 px (41% ekranu)** | **199 px (30%)** |

Dodatkowo na karcie znamienia zniknęło **zdublowane** zastrzeżenie o statusach
(„to Twoja prywatna organizacja dokumentacji, nie ocena medyczna”) — stopka
mówi to samo na każdym ekranie. Treść zastrzeżenia **została**; skrócona i
ciaśniejsza jest tylko forma. To zasada z ADR-0001, nie ozdoba.

Efekt na ekranach (375×667):

| Ekran | Przed | Po |
| --- | --- | --- |
| Mapa ciała | 1021 px | **944 px** |
| Kontrole | 1382 px | **1305 px** |
| Karta znamienia | 1048 px | **923 px** |

### Z czego świadomie zrezygnowałem

- **Rząd akcji (~76 px)** — już rozwiązany w tickecie 14, ustalenie 3 (akcje
  weszły do jednego pasa z tytułem).
- **Powrót + tytuł** — mierzone: wciągnięcie strzałki powrotu do wiersza tytułu
  zabiera ~44 px szerokości, więc długa nazwa („Kark — znamię przy włosach”)
  łamie się na 3 linie i wiersz rośnie bardziej, niż oszczędza. Zostaje.
- **Notka o datach na Kontrolach** — wygląda podobnie do zdublowanego
  zastrzeżenia, ale tłumaczy **skąd bierze się data** („ostatnie zdjęcie +
  interwał, albo ręcznie przesunięta”), więc zostaje.

### Zabezpieczenie

Nowy test `stały chrom (nagłówek + stopka + paddingi) nie puchnie` w
`e2e/ui-budget.spec.js`: mierzy sumę i wymaga **≤ 240 px**, czyli poniżej stanu
sprzed zmian (276). Powrót do poprzedniej stopki od razu czerwieni test.

### Wniosek

Dźwignią nie była nawigacja (patrz ticket 09 — dolny pasek tylko przenosi
piksele), a **stopka i paddingi**. Dalej zostaje nagłówek 113 px (17% ekranu),
ale jego wiersze to cele dotykowe 44 px wymagane przez projekt — ciaśniej się
nie da bez łamania zasady „wszystko klikalne ma ≥ 44 px” (ticket 10).
