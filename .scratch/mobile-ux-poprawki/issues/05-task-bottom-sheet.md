# 05 — Panel pinu jako bottom sheet (mobile)

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Na wąskim ekranie panel informacyjny pina pokazuje się jako **arkusz wysuwany
od dołu** (bottom sheet) z przyciemnionym tłem i uchwytem, zamiast lądować pod
mapą (gdzie był poza kadrem). Desktop bez zmian — kolumna z boku.

## Kryteria akceptacji

- [x] Mobile (`< lg`): arkusz `fixed` u dołu, `max-h-[85dvh]` + przewijanie,
      uchwyt, tło `z-40` z klikiem zamykającym, arkusz `z-50`.
- [x] Zamknięcie: klik w tło oraz przycisk „Zamknij" w panelu.
- [x] Desktop (`lg`): panel wraca do kolumny (sticky), bez tła i uchwytu.
- [x] Jeden egzemplarz panelu w DOM (bez duplikatów) — przełączany klasami.
- [x] Zbędne auto-przewijanie do panelu (dodane wcześniej) usunięte.

## Answer

Zrealizowane w `src/components/BodyMap.jsx` (kontener panelu przełączany
klasami mobile/desktop) oraz `src/components/LesionInfoPanel.jsx` (panel bez
własnej „karty" — chrome daje kontener).
