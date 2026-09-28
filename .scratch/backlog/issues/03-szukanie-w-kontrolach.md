# 03 — Wyszukiwanie i sortowanie w Kontrolach

Type: task
Status: ready-for-agent
Map: .scratch/backlog/map.md

## Problem

`src/components/Reminders.jsx` sortuje pozycje tylko po dacie kontroli i nie ma
żadnego wyszukiwania. Przy kilkunastu znamionach — a to realistyczna liczba —
trzeba przewijać całą listę, żeby znaleźć konkretne.

Lista znamion (`LesionsList.jsx`) ma już dokładnie to, czego brakuje tu:
pole wyszukiwania, filtr po statusie i **stan w adresie** (`?q=`, `?status=`),
więc filtr przeżywa odświeżenie i działa „wstecz”.

## Propozycja

Przenieść sprawdzony wzorzec, nie wymyślać nowego:

- użyć `readListParams` / `buildListParams` z `src/lib/listParams.js`
  (obsługują `status`, `q`, `sort`),
- filtrować przez `filterByQuery` z `src/lib/lesionView.js` (szuka po nazwie
  i po okolicy ciała — działa też dla nazw nadpisanych ręcznie),
- pole `type="search"` z `aria-label`, jak w liście znamion.

Do rozważenia: przełącznik „tylko zaległe”. Uwaga — po naprawie ticketu 02
„Usunięte” znikną z Kontroli, więc filtr po statusie może być tu mniej
przydatny niż na liście znamion.

## Kryteria akceptacji

- Wpisanie fragmentu nazwy zawęża listę kontroli i zapisuje się w adresie.
- Odświeżenie i „wstecz” zachowują filtr.
- Puste pole = brak filtra (pełna lista).
- Testy: e2e na zapis w adresie (wzór: `e2e/lesions.spec.js`).
