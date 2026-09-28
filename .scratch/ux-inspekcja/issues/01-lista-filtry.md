# 01 — Lista: filtry i sortowanie zajmują pół ekranu

Type: task
Status: ready-for-agent
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

- [ ] Domyślnie nad listą widać tylko przycisk "Filtry" + licznik/skrót.
- [ ] Rozwinięcie pokazuje obecne kontrolki; filtry działają jak dziś (stan w URL).
- [ ] "Wyczyść" działa; aktywny filtr jest oznaczony na przycisku.
