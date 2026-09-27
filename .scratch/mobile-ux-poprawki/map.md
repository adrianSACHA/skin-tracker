# Wayfinder: Poprawki UX mobile

Effort: `.scratch/mobile-ux-poprawki/`
Tickets: `.scratch/mobile-ux-poprawki/issues/`

## Destination

Usunąć drobne problemy układu na wąskich ekranach (Chrome / Android), wykryte po
wdrożeniu widoków mapy: zawijanie nawigacji, ucinane etykiety, modale wyższe niż
ekran, panel pinu poza widokiem.

## Decisions so far

- Wszystkie cztery poprawki wdrożone w jednym kroku (bez zmian backendu).

## Not yet specified (mgła)

Brak — panel pinu jako bottom sheet wdrożony (ticket 05).

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

## Frontier

Brak — wszystkie tickety `resolved`.
