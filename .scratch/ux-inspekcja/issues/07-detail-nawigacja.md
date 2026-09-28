# 07 — Szczegóły znamienia: długi widok bez nawigacji

Type: task
Status: ready-for-agent
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

- [ ] Dodanie/obejrzenie zdjęć i porównanie są dostępne od razu, bez długiego
      przewijania.
- [ ] Trend, historia i zarządzanie nadal dostępne (niżej / zwijane).
- [ ] Bez utraty funkcji i bez zmian backendu.
