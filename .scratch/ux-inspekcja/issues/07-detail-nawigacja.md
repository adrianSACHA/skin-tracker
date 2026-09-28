# 07 — Szczegóły znamienia: długi widok bez nawigacji

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Widok znamienia jest bardzo długi: nagłówek -> akcje -> (formularz) -> porównanie
-> wykres -> historia -> zarządzanie. Dużo przewijania, brak skrótu do sekcji.

## Decyzja (od użytkownika)

Najczęściej używane są **zdjęcia** i **porównanie** — to ma być na górze i
najłatwiej dostępne. Trend i historia są drugorzędne.

## Propozycja

- Kolejność/nawigacja wg ważności: **Zdjęcia** (dodaj + ostatnie) i
  **Porównanie** pierwsze; niżej **Trend** i **Historia** (mogą być zwijane);
  **Zarządzanie** na końcu.
- Opcja lekka: na górze skróty/anchors prowadzące do sekcji.
- Opcja pełniejsza: zakładki (Zdjęcia / Porównanie / Trend / Historia) ze
  startem na "Zdjęcia".

## Kryteria akceptacji

- [x] Dodanie/obejrzenie zdjęć i porównanie są dostępne od razu, bez długiego
      przewijania.
- [x] Trend, historia i zarządzanie nadal dostępne (niżej / zwijane).
- [x] Bez utraty funkcji i bez zmian backendu.

## Answer

Zrealizowane w LesionDetail.jsx: kolejność sekcji zmieniona na Porównanie ->
Zdjęcia (historia) -> Trend -> Zarządzanie, więc najczęściej używane (zdjęcia,
porównanie) są od razu u góry.
