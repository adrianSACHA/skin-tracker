# 04 — Panel pinu: przewinięcie na mobile

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Na wąskim ekranie panel informacyjny pina jest **pod** mapą. Po kliknięciu pinu
użytkownik nie widzi szczegółów (są poza kadrem) — trzeba przewinąć.

## Kryteria akceptacji

- [x] Po wybraniu pinu na ekranie < `lg` widok płynnie przewija się do panelu
      (`scrollIntoView`, `block: 'start'`).
- [x] Na desktopie (`lg`) nic się nie przewija (panel jest z boku).

## Answer

Zrealizowane w `src/components/BodyMap.jsx`: `panelRef` + efekt na `selectedId`
z guardem `matchMedia('(max-width: 1023px)')`.

## Notatka

Docelowo można zastąpić panel na mobile **bottom sheetem** — zapisane w mgle mapy.
