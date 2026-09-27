# 11 — Instalacja na iOS (instrukcja)

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Safari (iOS/iPadOS) nie wspiera `beforeinstallprompt`, więc na iPhone/iPadzie
aplikacji nie da się dodać jednym przyciskiem. Pokazujemy wtedy **instrukcję**:
„Udostępnij → Dodaj do ekranu początkowego".

## Kryteria akceptacji

- [x] Wykrywanie iOS/iPadOS (`isIos`) + `iosHint` = iOS i nie zainstalowana.
- [x] Przycisk „Zainstaluj" na iOS otwiera panel z instrukcją.
- [x] Android/Chrome bez zmian (natywny prompt).
- [x] Instrukcja znika, gdy aplikacja jest już zainstalowana.

## Answer

`src/lib/install.js` (`isIos`, `iosHint`) + `src/components/Layout.jsx`
(przycisk + panel z instrukcją).
