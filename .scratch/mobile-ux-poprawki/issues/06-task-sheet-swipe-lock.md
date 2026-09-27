# 06 — Bottom sheet: swipe w dół + blokada tła

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Arkusz (bottom sheet) da się zamknąć przeciągnięciem w dół za uchwyt, a pod
arkuszem tło nie przewija się.

## Kryteria akceptacji

- [x] Przeciągnięcie uchwytu w dół przesuwa arkusz (`translateY`, bez
      sprzężenia zwrotnego/animacji w trakcie).
- [x] Puszczenie po ~110 px zamyka arkusz; krótszy ruch wraca na miejsce
      (animacja `transition-transform`).
- [x] Swipe aktywne tylko na mobile (`min-width: 1024px` → nieaktywne).
- [x] Gdy arkusz otwarty na mobile, `body` ma `overflow: hidden`; po zamknięciu
      / na desktopie przywracane.

## Answer

Zrealizowane w `src/components/BodyMap.jsx`: `sheetDragY` + `sheetDragRef`,
handlery `onSheetPointer*` na uchwycie (z `touch-none`), efekt blokady
przewijania `document.body.style.overflow` wg `matchMedia`.
