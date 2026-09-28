# 08 — Nagłówek: tłoczno na telefonie

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Na wąskim ekranie w nagłówku: logo + "Zainstaluj" + przełącznik motywu +
"Wyloguj" (+ "Osoba:"). Zawija się i zajmuje miejsce.

## Decyzja (od użytkownika)

„Zainstaluj" ma się pokazywać **dopóki aplikacja nie jest zainstalowana**, lub
**przypominać co jakiś czas**. Ważne: musi być jasna informacja, że **bez
instalacji nie ma powiadomień w tle** (zostają tylko te w kalendarzu).

## Propozycja

- Przycisk **„Zainstaluj"** w nagłówku widoczny, gdy aplikacja nie jest
  zainstalowana i da się ją zainstalować (już działa; gdy przeglądarka nie
  wystawia promptu, pokazuje instrukcję — szczególnie iOS).
- **Przypominacz**: delikatny baner co jakiś czas (np. raz na 7 dni; data
  ostatniego pokazania w localStorage) gdy aplikacja nie jest zainstalowana —
  z przyciskiem „Zainstaluj" i informacją, że bez instalacji nie ma powiadomień
  w tle. Można zamknąć.
- Informacja o braku powiadomień bez instalacji również w panelu Kontroli
  (ticket 05).

## Kryteria akceptacji

- [x] „Zainstaluj" widoczne, dopóki aplikacja nie jest zainstalowana.
- [x] Baner przypomina okresowo (nie częściej niż raz na N dni) i da się zamknąć.
- [x] Komunikat wprost łączy brak instalacji z brakiem powiadomień w tle.

## Answer

Zrealizowane w src/components/Layout.jsx: przycisk „Zainstaluj" w nagłówku (aż do
instalacji) + baner przypominający raz na ~7 dni (data w localStorage), gdy apka
nie jest zainstalowana, z komunikatem „Bez instalacji zostaną tylko przypomnienia
w kalendarzu" i przyciskami „Zainstaluj"/„Nie teraz".
