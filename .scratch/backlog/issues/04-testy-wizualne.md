# 04 — Testy wizualne w e2e

Type: task
Status: ready-for-agent
Map: .scratch/backlog/map.md

## Uwaga (2026-09-29)

Część „liczbowa” tego ticketu **już istnieje**: `e2e/ui-budget.spec.js`
mierzy budżet miejsca na 375×667 (nagłówek ≤ 130 px, pierwsza treść nad
linią zgięcia). Powstał przy tickecie 08 i celowo nie jest zrzutem ekranu —
liczby są deterministyczne, więc działają tak samo lokalnie i w CI.

Zostaje druga część: **zrzuty ekranu** (`toHaveScreenshot`) dla regresji
wyglądu, których pomiar nie złapie. Poniższy plan nadal aktualny.

## Problem

Istniejące 18 testów e2e (`e2e/`) sprawdzają **treść i zachowanie**, ale nie
wygląd. Regresja układu albo stylów — element nachodzi na siebie, karta się
rozjeżdża, kolor traci kontrast — przechodzi przez testy niezauważona. A spora
część pracy w tym projekcie to właśnie poprawki UX/CSS (przewijanie, bottom
sheet, menu `⋯`, nagłówek z `flex-wrap`).

## Propozycja

Wykorzystać gotowy harness — dodać `expect(page).toHaveScreenshot()` dla kilku
ekranów:

1. logowanie,
2. wybór osoby (karta z liczbami + „zaległe”),
3. lista znamion (filtry zwinięte i rozwinięte),
4. mapa ciała (w desktopie i w 375×667).

Zasady, żeby to nie stało się „flaky”:

- **Ustalić środowisko zrzutów**: czcionki i antyaliasing zależą od systemu, więc
  baseline generujemy w tym samym środowisku, w którym potem porównujemy
  (najlepiej kontener/CI). Alternatywa — wysoka tolerancja, ale wtedy test
  przestaje cokolwiek łapać.
- `maxDiffPixelRatio` ustawiony świadomie (np. `0.01`), nie domyślne 0.
- Wymusić deterministyczne warunki: `colorScheme`, stały viewport, wyłączone
  animacje (jest już `motion-safe`/`motion-reduce`, więc da się użyć
  `reducedMotion: 'reduce'`).
- Zrzuty traktować jako **podręczne** — aktualizować świadomie
  (`--update-snapshots`), nie „bo test czerwony”.

Osobno warto rozważyć zrzuty trybu ciemnego — to druga połowa stylów, której
dziś nic nie pilnuje.

## Kryteria akceptacji

- Nowy plik e2e ze zrzutami przechodzi lokalnie i w CI z ustaloną tolerancją.
- Baseline jest w repo, a instrukcja aktualizacji opisana w README (sekcja
  „Testy”).
