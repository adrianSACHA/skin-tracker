# 05 — Menu `⋯` w nagłówku + modal potwierdzenia dla `Usuń zdjęcie tła`

Type: prototype
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Jak zbudować menu `⋯` z akcjami tła i jak wpiąć w nie istniejący modal
potwierdzenia?

Ustalone:

- `Zmień zdjęcie tła` / `Usuń zdjęcie tła` schowane w menu `⋯` w nagłówku
  widoku mapy.
- `Usuń zdjęcie tła` wymaga modala potwierdzenia (wzorzec już istnieje:
  `src/components/ConfirmDialog.jsx`, użyty przy usuwaniu znamienia i zdjęcia tła).

Do rozstrzygnięcia:

- Komponent menu: użyć gotowej zależności, czy własny `details`/`popover`?
  (Zasada: nie dodajemy zależności bez uzasadnienia — sprawdzić, czy jest coś
  już w projekcie, np. wzorce w `Layout.jsx`/`ThemeToggle.jsx`.)
- A11y: rola `menu`/`menuitem`, obsługa Escape, klik poza, fokus.
- Warianty: pozycje w menu z ikonami czy bez; czy „Usuń zdjęcie tła" tylko gdy
  `image_url` istnieje (dziś warunkowe).
- Czy menu pokazuje się też w stanie pustym (brak widoków) — patrz ticket 04.

Kontekst: `react-zoom-pan-pinch` jest jedyną „UI-ową" zależnością obok
`sonner`; brak biblioteki menu.

Odpowiedź steruje ticketem 11.

## Answer

Menu `⋯` = własny `OverflowMenu` w `BodyMap.jsx` (bez nowej zależności):
`role="menu"`/`menuitem`, zamyka się na Escape i klik poza, fokus wraca do
trigera. Pozycje: „Zmień zdjęcie tła", „Usuń zdjęcie tła" (tylko gdy widok
ma zdjęcie, otwiera `ConfirmDialog`), separator, „Ustawienia widoku…".

Reuse istniejącego `ConfirmDialog` (ten sam wzorzec co usuwanie znamienia).
