# 07 — `Usuń widok` przy znamionach: blokada czy usunięcie po potwierdzeniu

Type: grilling
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Czy `Usuń widok` blokuje się, gdy widok ma znamiona (i wymaga najpierw ich
usunięcia), czy usuwa wszystko po potwierdzeniu?

Kontekst:

- Ustalone: `Usuń widok` usuwa też wszystkie znamiona w widoku → dlatego jest
  w panelu ustawień widoku, nie w szybkim menu (`⋯`).
- `body_maps` ma `lesions.body_map_id` — usunięcie widoku kaskaduje na znamiona
  (i ich zdjęcia w `lesion_photos` / bucketcie).
- Warianty:
  - **A — blokada:** przycisk wyszarzony, dopóki widok ma znamiona; komunikat
    „Najpierw usuń N znamion tego widoku".
  - **B — usuń po potwierdzeniu:** modal pokazuje liczbę znamion i zdjęć do
    usunięcia, użytkownik potwierdza.
- Do rozstrzygnięcia też: co znika — rekord `body_map`, plik tła z bucketu,
  znamiona i ich zdjęcia (kaskada / ręcznie).

Odpowiedź steruje ticketem 12.

## Answer

Wariant **B: usuwa wszystko po potwierdzeniu** (bez blokady).

Modal pokazuje liczbę znamion: „Usunięty zostanie widok «X» oraz N
znamion w nim (wraz z ich zdjęciami)".

Implementacja (`runDeleteView`): najpierw kasuje `lesions` widoku
(bo `body_map_id` jest `on delete set null` — inaczej osierocone!),
potem rekord `body_maps`, na końcu best-effort pliki z bucketu.
