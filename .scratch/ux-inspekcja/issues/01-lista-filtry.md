# 01 — Lista: filtry i sortowanie zajmują pół ekranu

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem (zgłoszony)

Na Liście znamion od razu widać: 5 pigułek filtra statusu (każda z checkboxem
i kropką), pole "Interwał (tyg.)" oraz "Sortuj". Na telefonie zajmuje to
prawie pół ekranu, zanim zobaczymy same znamiona.

## Propozycja

- Schować filtr + sortowanie pod przycisk **"Filtry"** (rozwiń/zwij), domyślnie
  zwinięty.
- Nad listą pokazać zwięzły skrót, np. "Wszystkie · wg terminu · 12".
- "Interwał (tyg.)" przenieść do zwijanego panelu (to ustawienie zmienia się
  rzadko).
- Gdy jakiś filtr jest aktywny, pokazać to na przycisku (np. "Filtry: 2").

## Kryteria akceptacji

- [x] Domyślnie nad listą widać tylko przycisk "Filtry" + licznik/skrót.
- [x] Rozwinięcie pokazuje obecne kontrolki; filtry działają jak dziś (stan w URL).
- [x] "Wyczyść" działa; aktywny filtr jest oznaczony na przycisku.

## Answer

Zrealizowane w src/components/LesionsList.jsx: panel filtrów zwijany (stan
showFilters, domyślnie zwinięty). Nad listą tylko przycisk "Filtry" (+ plakietka
z liczbą aktywnych statusów) i skrót "N z M · wg terminu/pilności". W środku
panel: pigułki statusu + "Wyczyść" oraz interwał i sortowanie.
