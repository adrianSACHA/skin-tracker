# 11 — Wdrożenie menu `⋯` z akcjami tła i modalem potwierdzenia

Type: task
Status: resolved
Blocked by: 05
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

`Zmień zdjęcie tła` i `Usuń zdjęcie tła` przenoszą się z paska przycisków do
menu `⋯` w nagłówku widoku mapy. `Usuń zdjęcie tła` otwiera modal potwierdzenia
(`ConfirmDialog`).

## Kryteria akceptacji

- [ ] `Zmień zdjęcie tła` i `Usuń zdjęcie tła` nie są już osobnymi przyciskami
      w nagłówku — są w menu `⋯`.
- [ ] `Usuń zdjęcie tła` otwiera `ConfirmDialog` (wzorzec istnieje) i po
      potwierdzeniu zeruje `image_url` + sprząta plik z bucketu (bez zmian).
- [ ] `Usuń zdjęcie tła` dostępne tylko gdy widok ma zdjęcie.
- [ ] Menu zamyka się na Escape i klik poza; fokus wraca do przycisku `⋯`.
- [ ] Bez zmian w logice `handleRefUpload` / `runDeleteRef` (tylko warstwa UI).

## Kontekst

- `BodyMap.jsx` → przyciski obok `+ Dodaj znamię`; `refConfirm` + `ConfirmDialog`
  na dole pliku już obsługują usuwanie tła.
- Kształt menu → ticket 05.

## Comments

- Zablokowany przez 05 (prototyp menu `⋯`).

## Answer

Zrealizowane. `OverflowMenu` + `ConfirmDialog` dla „Usuń zdjęcie tła"; logika `handleRefUpload`/`runDeleteRef` bez zmian.
