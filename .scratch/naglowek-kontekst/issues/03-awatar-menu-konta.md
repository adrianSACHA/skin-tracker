# 03 — Osoba jako awatar + menu konta (korekta ticketu 01)

Type: design
Status: resolved
Map: .scratch/naglowek-kontekst/map.md

## Problem

Po tickecie 01 (osoba jako osobny przycisk „Ja ▾" obok czystego „≡") właściciel
zgłosił: *„nie podoba mi się to hamburger menu z nazwą profilu"* — nazwa osoby
i hamburger stały obok siebie, więc dalej czytało się jak „menu profilu". Doszła
prośba o **animację przy otwieraniu**.

## Decyzja

Zamiast dwóch kontrolek — **jedna**: awatar z inicjałem osoby (`J` / `S`)
otwierający **menu konta** (zmiana osoby / motyw / instalacja / wylogowanie).
Hamburger znika na ekranie osoby; zostaje na ekranie wyboru osoby i logowania
(tam nie ma inicjału do pokazania). Menu pojawia się z animacją.

## Kryteria akceptacji

- [x] Na ekranie osoby po prawej jest **jedno** kontrolko: awatar z inicjałem.
- [x] Awatar otwiera menu: „Zmień osobę", motyw, instalacja (gdy dostępna),
      wylogowanie.
- [x] Brak osobnego „≡" na ekranie osoby (jest na wyborze osoby / logowaniu).
- [x] Menu pojawia się z animacją; przy `prefers-reduced-motion` bez ruchu.
- [x] Widać, w czyjej dokumentacji jesteś (inicjał) — zachowana ochrona z
      ticketu 14.
- [x] Nagłówek w budżecie (61 px), stały chrom ≤ 190 px.

## Answer

Zrealizowane.

- `OverflowMenu` dostał prop `trigger` (własna zawartość przycisku — tu awatar)
  oraz klasę `menu-in`.
- `Layout`: awatar z inicjałem (`display_name`) jako trigger menu konta;
  pozycja „Zmień osobę" wróciła do menu (usunięta w tickecie 01). Gdy nie ma
  wybranej osoby — zwykłe „≡".
- `src/index.css`: keyframes `menuIn` (fade + delikatna skala, 150 ms) + guard
  `prefers-reduced-motion`. Animacja dotyczy **wszystkich** menu w apce
  (także „⋯" na kartach).
- Testy: `person`/`reminders` otwierają menu konta i klikają „Zmień osobę";
  `MENU_BUTTON` w `e2e/support/app.js` łapie teraz „Menu…" i „Konto…".
- Zrzuty wizualne przegenerowane. Zestaw: **50 e2e + 101 unit** zielony;
  nagłówek **61 px**, stały chrom **147 px**.

### Świadomy koszt

Zmiana osoby to teraz **2 kliknięcia** (awatar → menu) zamiast 1. Właściciel
zaakceptował to po obejrzeniu podglądu (wariant „C").
