# Wayfinder: Poprawki UX mobile

Effort: `.scratch/mobile-ux-poprawki/`
Tickets: `.scratch/mobile-ux-poprawki/issues/`

## Destination

Usunąć drobne problemy układu na wąskich ekranach (Chrome / Android), wykryte po
wdrożeniu widoków mapy: zawijanie nawigacji, ucinane etykiety, modale wyższe niż
ekran, panel pinu poza widokiem.

## Decisions so far

- Dopracowanie mobile w 10 krokach (bez zmian backendu): zawijanie nawigacji;
  etykiety (tooltip pinu); modale (ograniczona wysokość + przewijanie); panel
  pinu jako **bottom sheet** (przewijanie + swipe w dół + blokada tła);
  przewijanie do panelu; szczegóły znamienia (porównanie przeciąganym suwakiem,
  czytelniejszy wykres, lightbox historii); menu „Do kalendarza" w kadrze;
  porządki wcięć; przycisk **„Zainstaluj"** (PWA).

## Not yet specified (mgła)

Brak. (Do rozważenia w przyszłości: instrukcja instalacji dla iOS — Safari nie
wspiera `beforeinstallprompt`.)

## Out of scope

- Przypomnienia / Web Push — osobny effort `pwa-przypomnienia`.

## Tickets

| #  | Type | Tytuł                                                       | Blocked by | Status   |
| -- | ---- | ----------------------------------------------------------- | ---------- | -------- |
| 01 | task | [Nawigacja: zawijanie (badge nie rozpycha)](issues/01-task-nawigacja-wrap.md) | — | resolved |
| 02 | task | [Tooltip pinu: długie nazwy zawijają](issues/02-task-tooltip-wrap.md) | — | resolved |
| 03 | task | [Modale: max-wysokość + przewijanie](issues/03-task-modale-scroll.md) | — | resolved |
| 04 | task | [Panel pinu: przewinięcie na mobile](issues/04-task-panel-scroll.md) | — | resolved |
| 05 | task | [Panel pinu jako bottom sheet (mobile)](issues/05-task-bottom-sheet.md) | 04 | resolved |
| 06 | task | [Bottom sheet: swipe w dół + blokada tła](issues/06-task-sheet-swipe-lock.md) | 05 | resolved |
| 07 | task | [Szczegóły znamienia: porównanie / wykres / historia na mobile](issues/07-task-detail-mobile.md) | — | resolved |
| 08 | task | [„Do kalendarza": menu w kadrze na mobile](issues/08-task-kalendarz-menu-w-kadrze.md) | — | resolved |
| 09 | task | [Porządki: rozjechane wcięcia w Lista/Kontrole](issues/09-task-porzadki-wciecia.md) | — | resolved |
| 10 | task | [Przycisk „Zainstaluj" (PWA)](issues/10-task-install-button.md) | — | resolved |

## Status

**Domknięty** (2026-09-27) — wszystkie 10 ticketów `resolved`.

## Frontier

Brak — wszystkie tickety `resolved`.
