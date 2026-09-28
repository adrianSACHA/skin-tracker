# 02 — Upload: kompaktowe przyciski edycji zdjęcia

Type: task
Status: resolved
Map: .scratch/ux-inspekcja-2/map.md

## Problem

W formularzu zdjęcia jest 5 przycisków edycji z długimi etykietami ("⟲ Obróć w
lewo", "⟳ Obróć w prawo", "↔ Odbij w poziomie", "↕ Odbij w pionie", "Reset").
Na telefonie zawijają się do 2-3 linii i zabierają miejsce.

## Propozycja

- Ikona zawsze; etykieta tekstowa tylko od sm w górę (hidden sm:inline).
- Zadbać o aria-label / title dla dostępności.

## Kryteria akceptacji

- [x] Na telefonie przyciski edycji mieszczą się w 1 linii.
- [x] Każdy przycisk ma czytelną nazwę (aria-label/title).
- [x] Funkcje bez zmian.

## Answer

Zrealizowane w src/components/PhotoUploadForm.jsx: etykiety tekstowe tylko od sm
(hidden sm:inline), ikona zawsze; dodane aria-label i title.
