# 03 — Segmentator: krótsze etykiety kroków

Type: task
Status: resolved
Map: .scratch/ux-inspekcja-2/map.md

## Problem

Etykiety kroków w segmentatorze są długie ("Krok 1 z 2 · Skala ✓", "Krok 2 z 2 ·
Znamię") i na telefonie się zawijają.

## Propozycja

- Krótko: "1. Skala" / "2. Znamię" (+ znacznik ukończenia skali).
- Pełny opis w aria-label (np. "Krok 1 z 2: skala").

## Kryteria akceptacji

- [x] Krótkie etykiety kroków (mieszczą się w linii na telefonie).
- [x] aria-label zachowuje pełny opis dla czytników ekranu.
- [x] Bez zmian logiki kroków.

## Answer

Zrealizowane w src/components/LesionSegmenter.jsx: "1. Skala" / "2. Znamię"
(+ znacznik ukończenia skali), aria-label "Krok 1 z 2: skala" / "Krok 2 z 2:
znamię".
