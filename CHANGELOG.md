# Changelog

Wszystkie istotne zmiany w aplikacji Skin Tracker. Format inspirowany
[Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

> To log wdrożeń — uzupełniany ręcznie po zakończeniu prac. Szczegóły techniczne
> (pełna historia commitów) są w `git log`.

## [Niezakończone] — 2026-09-27

### Dodane

- **Mapa ciała — widoki z pełnego słownika okolic.** 17 predefiniowanych okolic
  ciała (`src/lib/bodyAreas.js`) w dropdownie; można też dodać własną nazwę
  okolicy i zmienić istniejącą. `body_maps.view_name` trzyma klucz słownika albo
  własną nazwę.
- **Auto-nazwy znamion z prefiksem okolicy** (`Tył-1`, `Plecy-prawa-1`), z
  możliwością nadpisania ręcznego. Numer = 1 + najwyższy istniejący w widoku.
- **Osobny ekran „Dodaj widok"** — w trakcie wyboru okolicy i wgrywania tła
  bieżący widok (mapa, zakładki) jest ukryty; powrót przez „← Mapa ciała".
- **Wybór źródła zdjęcia tła** — „Zrób zdjęcie" (aparat, `capture`) obok
  „Wybierz z plików"; to samo przy zdjęciu znamienia.
- **Skeleton ładowania widoku** (pasek narzędzi + zdjęcie z pinami) zamiast
  spinnera; zdjęcie wstępnie wczytywane, więc treść pod mapą nie „skacze".
- **Panel ustawień widoku** (z menu `⋯`) — zmiana nazwy okolicy oraz usunięcie
  widoku razem ze znamionami (z potwierdzeniem i liczbą znamion).

### Zmienione

- **Mapa ciała — układ akcji:** zakładki widoków na samej górze; „+ Dodaj widok"
  w strefie zakładek, „+ Dodaj znamię" przy mapie (akcje rozdzielone).
- **Menu `⋯`** pozycjonowane w kadrze ekranu (mobile) — nie wychodzi już poza
  lewą krawędź; dociągane przy zmianie rozmiaru/obrocie.
- **Etykieta pinu** przy krawędziach mapy wyrównuje się do pina (nie jest
  ucinana przez krawędź).
- **Ujednolicone nazwy statusów** („Wymaga uwagi") — legenda mapy i lista
  korzystają z jednego źródła (`src/lib/status.js`).
- **Lista znamion:** filtr po statusie i sortowanie po terminie kontroli, stan
  w URL; breadcrumb „← Mapa ciała" nad tytułem.
- **Kontrole:** ustawienia („Przypomnij", interwał) na dole widoku; badge'y
  `Zaległe`/`W ciągu 30 dni` wyszarzone przy zera; „Zobacz kontrolę →";
  badge „data ręcznie przesunięta".

### Naprawione

- **„Taki widok już istnieje"** przy dodawaniu okolicy, której wiersz w
  `body_maps` istnieje bez zdjęcia tła — teraz tło jest dogrywane do tego wiersza.
- **`SignedImage`** nie pokazuje już zdjęcia poprzedniego znamienia przy zmianie
  wybieranego znamienia (zerowanie starego URL).
- **Znikające „skakanie" treści** przy przełączaniu widoku mapy (preload zdjęcia
  + rezerwacja wysokości skeletona wg realnego stosunku boków).

### Uwaga

- Zmiany z tej sekcji zostały wdrożone; część z nich powstała jako szybkie
  poprawki UX (mobile) po zamknięciu iteracji `mapa-widoki-znamiona` i nie ma
  osobnych ticketów w `.scratch/`.
