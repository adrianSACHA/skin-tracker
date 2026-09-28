# Wayfinder: Inspekcja UX

Effort: .scratch/ux-inspekcja/
Tickets: .scratch/ux-inspekcja/issues/

## Destination

Przejrzeć najważniejsze ekrany pod kątem UX i spisać konkrety ("co jest nie
tak") jako tickety, a potem je posprzątać. Zasada bez zmian: aplikacja nie
diagnozuje; chodzi o czytelność i mniej szumu, nie o nowe funkcje.

## Decisions so far

- Inspekcja to przegląd kodu i ekranów; wnioski ponumerowane niżej.
- Filtr/sortowanie na liście DZIAŁA (effort lesion-list-filters) — tu chodzi
  o to, że za dużo tego widac naraz.

## Not yet specified (mgła)

- Kolejne ekrany po pierwszych (login/wybór osoby, formularz uploadu).
- Czy chcemy wprowadzić jeden wspólny wzorzec "zwijanych filtrów" w całej apce.

## Out of scope

- Nowe funkcje (poza wyszukiwaniem, jeśli wejdzie).
- Zmiany backendu.

## Tickets

| #  | Type | Tytuł | Blocked by | Status |
| -- | ---- | ----- | ---------- | ------ |
| 01 | task | [Lista: filtry i sortowanie zajmują pół ekranu](issues/01-lista-filtry.md) | — | resolved |
| 02 | task | [Lista: gęstość karty znamienia](issues/02-lista-karty.md) | — | resolved |
| 03 | task | [Lista: wyszukiwanie po nazwie/okolicy](issues/03-lista-wyszukiwanie.md) | — | resolved |
| 04 | task | [Kontrole: przeładowany rząd akcji na karcie](issues/04-kontrole-akcje.md) | — | resolved |
| 05 | task | [Kontrole: panel "Przypomnienia na telefon" zwijany](issues/05-kontrole-panel.md) | — | resolved |
| 06 | task | [Mapa ciała: legenda statusów zajmuje miejsce](issues/06-mapa-legenda.md) | — | resolved |
| 07 | task | [Szczegóły znamienia: długi widok bez nawigacji](issues/07-detail-nawigacja.md) | — | resolved |
| 08 | task | [Nagłówek: tłoczno na telefonie](issues/08-naglowek.md) | — | resolved |

## Frontier

Brak — wszystkie 8 ticketów **resolved**. Effort domknięty.
