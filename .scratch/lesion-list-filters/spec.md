# Spec: Filtr i sortowanie listy znamion

Status: ready-for-agent

## Problem

Przy kilkunastu znamionach widok `LesionsList` pokazuje wszystko naraz —
wszystkie `status` obok siebie. Żeby znaleźć to, co wymaga uwagi (`watch`,
`urgent` albo najbliższa kontrola), trzeba przewijać całą listę.

## Zakres

- Filtr po `status` (wielokrotny wybór: `new`, `stable`, `watch`, `removed`, `urgent`).
- Sortowanie po `next_check_at` rosnąco; znamiona bez terminu na końcu.
- Wybrane filtry zapamiętane w URL (HashRouter), aby przetrwały odświeżenie.

## Kryteria akceptacji

- Zaznaczenie jednego lub więcej `status` zawęża listę do tych znamion.
- Brak zaznaczeń = pokaż wszystkie znamiona (stan domyślny).
- Sortowanie po `next_check_at` stawia najpilniejsze kontrole na górze.
- Filtry i sortowanie są odzwierciedlone w hash URL i odtwarzane po odświeżeniu.

## Poza zakresem

- Wyszukiwanie po `label` — osobny ticket.
- Widoki między profilami (`person`) — lista nadal działa w kontekście wybranego profilu.

## Uwagi

- Terminologia zgodna z modelem danych: `lesion`, `status`, `next_check_at`, `person`.
- Zakres ograniczony do frontendu — bez zmian w schemacie Supabase.
