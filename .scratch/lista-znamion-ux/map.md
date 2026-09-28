# Wayfinder: Uproszczenie UX Listy znamion

Effort: `.scratch/lista-znamion-ux/`
Tickets: `.scratch/lista-znamion-ux/issues/`

## Destination

Lista znamion „za dużo się dzieje" — nadmiar kontrolek (5 pigułek statusu,
interwał, sortowanie) i wizualnego szumu. Celem jest czytelniejszy widok,
zwłaszcza na telefonie, bez utraty funkcji (filtr + sortowanie działają i mają
stan w URL — patrz `lesion-list-filters`).

## Decisions so far

- Filtr po statusie, sortowanie po terminie i stan w URL są zrobione
  (`lesion-list-filters`, domknięty). Ta iteracja to **uproszczenie prezentacji**.

## Not yet specified (mgła)

- Co konkretnie przeszkadza (lista kontroli? gęstość kart? pigułki?).
- Czy filtry schować pod „Filtry" (rozwiń/zwiń), czy skrócić pigułki, czy
  przenieść sortowanie do nagłówka listy.

## Out of scope

- Dodawanie znamion / mapa ciała (osobne).
- Wyszukiwanie po nazwie — jeśli wejdzie, osobny ticket.

## Tickets

| #  | Type    | Tytuł                                                       | Blocked by | Status     |
| -- | ------- | ----------------------------------------------------------- | ---------- | ---------- |
| 01 | task    | [Uproszczenie kontrolek i gęstości listy](issues/01-uproszczenie-ux.md) | — | needs-info |

## Frontier

**01** — czeka na doprecyzowanie (co konkretnie „za dużo").
