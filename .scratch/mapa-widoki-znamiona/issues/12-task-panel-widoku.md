# 12 — Wdrożenie panelu ustawień widoku z `Usuń widok`

Type: task
Status: resolved
Blocked by: 06, 07
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Panel ustawień widoku (forma wg ticketu 06) ze zmianą nazwy widoku oraz
`Usuń widok` (zachowanie wg ticketu 07: blokada vs usunięcie po potwierdzeniu).

## Kryteria akceptacji

- [ ] Wejście do panelu z `⋯` / kontrolki wg ticketu 06.
- [ ] Panel pozwala zmienić nazwę widoku (reuse dropdownu z ticketu 09).
- [ ] `Usuń widok` jest w panelu (nie w szybkim menu), z modalem potwierdzenia.
- [ ] Zachowanie przy znamionach zgodne z decyzją z ticketu 07 (blokada z liczbą
      znamion albo potwierdzenie z liczbą znamion/zdjęć).
- [ ] Usunięcie widoku sprząta `body_maps` i (jeśli decyzja) znamiona + pliki;
      po usunięciu panel się zamyka, a mapa wybiera inny widok / stan pusty.
- [ ] Bez zmian schematu poza tym, co rozstrzygnie ticket 07.

## Kontekst

- `BodyMap.jsx`: `bodyMaps`, `viewByKey`, `activeView`, `availableViews`;
  usuwanie tła już pokazuje wzorzec sprzątania pliku (`removeStorageFile`).

## Comments

- Zablokowany przez 06 (forma panelu) i 07 (zachowanie `Usuń widok`).

## Answer

Zrealizowane. Modal ustawień widoku ze zmianą nazwy i `Usuń widok` (kasuje znamiona widoku i pliki).
