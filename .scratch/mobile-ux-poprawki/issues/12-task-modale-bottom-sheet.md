# 12 — Modale jako bottom sheet na mobile

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Ujednolicenie z panelem pinu: na telefonie modale wysuwają się **od dołu**
(arkusz, zaokrąglone górne rogi), a na desktopie zostają wyśrodkowane.

## Kryteria akceptacji

- [x] `ConfirmDialog` (wszystkie potwierdzenia): `items-end` na mobile,
      `sm:items-center sm:p-4` na desktopie; panel `rounded-t-2xl sm:rounded-xl`.
- [x] Modal „Ustawienia widoku" (BodyMap): to samo.
- [x] Bez zmian funkcjonalnych (Esc / klik w tło / focus).

## Answer

`src/components/ConfirmDialog.jsx` + `src/components/BodyMap.jsx` — dodane
responsywne klasy pozycjonowania panelu.
