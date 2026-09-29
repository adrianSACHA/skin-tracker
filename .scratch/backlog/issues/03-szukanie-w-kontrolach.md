# 03 — Wyszukiwanie i sortowanie w Kontrolach

Type: task
Status: resolved
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

## Answer

Zrealizowane w `src/components/Reminders.jsx`:

- pole `type="search"` („Szukaj kontroli”) pojawia się tylko wtedy, gdy jest
  co filtrować, i przechodzi przez ten sam wzorzec co lista znamion:
  `readListParams` / `buildListParams` (`src/lib/listParams.js`) oraz
  `filterByQuery` (`src/lib/lesionView.js`) — szuka po nazwie znamienia i po
  okolicy ciała, więc działa też dla nazw nadpisanych ręcznie,
- stan w adresie (`?q=`), więc filtr przeżywa odświeżenie i „wstecz”,
- obok pola licznik „N z M” (wzór z listy znamion),
- osobny pusty stan: „Brak kontroli dla podanego szukania.”

**Decyzja: sortowanie odpuszczone.** Lista i tak jest posortowana po terminie
(najpilniejsze na górze), a przełącznik „wg pilności statusu” ma sens na
liście znamion, gdzie obok terminu widać status. Tutaj dołożyłby tylko
kolejny element do panelu.

**Decyzja: pasek „Zaległe / W ciągu 30 dni” zostaje CAŁKOWITY**, niezależny od
szukania. Dzięki temu zawsze zgadza się ze znacznikiem przy „Kontrole”
w nagłówku (to ta sama liczba). Kontekst daje licznik „N z M”.

**Błąd znaleziony przy okazji (naprawiony):** menu „⋯” w Kontrolach ma do 9
pozycji („Przesuń o N tyg.”). `OverflowMenu` pilnował tylko pozycji poziomej,
więc przy przycisku nisko na ekranie dolne pozycje wychodziły **za dół
ekranu** i były nieosiągalne — pozycji `fixed` nie da się doscrollować
stroną. Teraz menu wybiera stronę z większą ilością miejsca (dół albo góra)
i ogranicza wysokość do tego, co się mieści.

Testy: 2 e2e (`e2e/reminders.spec.js`) — zawężanie listy + adres +
odświeżenie oraz pusty stan przy braku trafień.
