# 01 — Logowanie: spójne kolory z resztą apki

Type: task
Status: resolved
Map: .scratch/ux-inspekcja-2/map.md

## Problem

Ekran logowania używa palety gray-* (tła, obramowania, teksty), a reszta
aplikacji slate-*. To wizualny rozjazd.

## Propozycja

Ujednolicić na slate-* (spójnie z Layout i pozostałymi widokami).

## Kryteria akceptacji

- [x] Login używa slate-*.
- [x] Bez zmian funkcjonalnych.

## Answer

Zrealizowane w src/components/Login.jsx: gray-* -> slate-* (10 wystąpień).
