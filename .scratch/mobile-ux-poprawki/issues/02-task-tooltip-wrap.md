# 02 — Tooltip pinu: długie nazwy zawijają

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Etykieta nad pinem na mapie nie może wychodzić poza mapę ani być ucinana, gdy
nazwa znamienia jest długa (`whitespace-nowrap` + `overflow: hidden` ciął tekst).

## Kryteria akceptacji

- [x] Długa nazwa zawija się w obrębie ograniczonej szerokości.
- [x] Krótkie nazwy bez zmian (wciąż jedna linia, wyśrodkowane).
- [x] Zostaje wyrównywanie do krawędzi przy pinach przy brzegu mapy.

## Answer

Zrealizowane w `src/components/BodyMap.jsx`: `whitespace-nowrap` →
`w-max max-w-[10rem] break-words text-center`.
