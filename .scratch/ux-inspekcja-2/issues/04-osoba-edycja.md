# 04 — Wybór osoby: zmiana nazwy i usunięcie

Type: task
Status: resolved
Map: .scratch/ux-inspekcja-2/map.md

## Problem

Na ekranie wyboru osoby można tylko dodać osobę — nie da się zmienić nazwy ani
usunąć istniejącej.

## Do decyzji (needs-triage)

- Czy w ogóle potrzebne (jedno konto, kilka osób)?
- Usunięcie osoby usuwa też jej znamiona i zdjęcia (nieodwracalne) — czy chcemy
  taką możliwość w UI?

## Propozycja (warianty)

- A: tylko zmiana nazwy (prosty update).
- B: zmiana nazwy + usunięcie (modal z ostrzeżeniem; kaskada on delete cascade
  po stronie bazy + sprzątanie plików ze Storage).

## Answer

**Decyzja: B.** Zrealizowane w src/components/PersonSelector.jsx: karta osoby ma
menu „⋯" z „Zmień nazwę" (inline formularz) i „Usuń osobę" (danger, modal
potwierdzenia). Usuwanie kasuje najpierw pliki ze Storage
(removePersonFiles — rekurencyjnie, best-effort), potem rekord osoby
(kaskada w bazie usuwa znamiona i zdjęcia). Toast po sukcesie.
