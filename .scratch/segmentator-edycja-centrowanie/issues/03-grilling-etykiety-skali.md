# 03 — Etykiety skali: „moneta / linijka" i „Długość odcinka referencyjnego"

Type: grilling
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Ujednolicić nazewnictwo skali tak, by uwzględniało linijkę, nie tylko monetę.
Miejsca do decyzji:

- „1. Skala (moneta)" → „1. Skala (moneta / linijka)"? (`LesionSegmenter.jsx`)
- pole „Średnica monety (mm)" → „Długość odcinka referencyjnego (mm)"?
  (`LesionSegmenter.jsx`, `id="coin-mm"`, presety `COIN_PRESETS`).
- checkbox w `PhotoUploadForm.jsx` już mówi „(moneta / linijka)" — potwierdzić
  spójność z resztą.
- teksty pomocnicze i błędy: „kliknij dwa końce średnicy monety", ostrzeżenie
  „bez skali (krok 1) nie obliczę mm²/mm".

Uwaga na glosariusz: `CONTEXT.md` definiuje `Kalibracja` jako „odniesienie skali
(np. znana średnica monety)" — jeśli zmieniamy pojęcie na „odcinek referencyjny",
to definicję też trzeba zaktualizować. Bez zmian w bazie/kodzie.

## Answer

Decyzja (potwierdzona przez użytkownika): ujednolicamy nazewnictwo na
„moneta / linijka" i odchodzimy od założenia monety.

- Krok 1: „1. Skala (moneta / linijka)".
- Pole: „Średnica monety (mm)" → **„Długość odcinka referencyjnego (mm)"**
  (`id="coin-mm"`, podpowiedź „np. średnica monety albo 1 cm na linijce").
  `COIN_PRESETS` zostają jako szybki wybór w `datalist` (nie usuwamy).
- Instrukcja i komunikaty: „wskaż **dwa końce znanego odcinka** (średnica monety
  albo odcinek linijki)" zamiast „dwa końce średnicy monety"; analogicznie
  komunikat błędu o braku skali.
- Checkbox w `PhotoUploadForm.jsx` jest już spójny — bez zmian.
- `CONTEXT.md` → `Kalibracja`: dopisać „…albo odcinek linijki".

Nazewnictwo wdrożymy razem z flow (ticket 09), żeby nie ruszać pliku dwa razy.
Zmiany wyłącznie w warstwie UI/tekstów — bez bazy i bez modelu.
