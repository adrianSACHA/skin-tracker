# 03 — Modale: max-wysokość + przewijanie

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Modale nie mogą być obcinane, gdy treść jest wyższa niż ekran telefonu.

## Kryteria akceptacji

- [x] Modal potwierdzenia — ograniczona wysokość + przewijanie treści
      (`max-h-[calc(100dvh-2rem)] overflow-y-auto`).
- [x] Modal „Ustawienia widoku" — to samo.

## Answer

Zrealizowane w `src/components/ConfirmDialog.jsx` (wspólny modal) oraz w modalu
ustawień widoku w `src/components/BodyMap.jsx`.
