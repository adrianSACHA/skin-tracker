# 08 — Nagłówek na telefonie zjadał 43% ekranu

Type: task
Status: resolved
Map: .scratch/backlog/map.md

## Problem

Na ekranie telefonu (375×667) nagłówek zajmował **285 px**, czyli **43%
wysokości**, zanim dało się zobaczyć cokolwiek. Pierwsza kontrola na liście
startowała na **531 px**, a licznik „Zaległe” na Kontrolach kończył się na
**720 px** — poniżej linii zgięcia, czyli niewidoczny bez przewijania.

Trzy przyczyny (zmierzone):

| Element | Wysokość |
| --- | --- |
| Pasek logo + przyciski (**zawijał się na 2 linie**) | 104 px |
| Nawigacja (Mapa / Lista / Kontrole) | 52 px |
| Baner „Zainstaluj aplikację, żeby…” | **129 px** |

Przycisk „Zainstaluj” miał 105 px szerokości z tekstem, więc razem z logo,
motywem i „Wyloguj” nie mieścił się w 375 px i spychał pasek do dwóch linii.
Stan dotyczył głównie sytuacji **przed instalacją** — po instalacji przeglądarka
nie wysyła `beforeinstallprompt`, więc przycisk i baner znikają same.

## Answer

**Decyzja (użytkownik):** komunikaty o instalacji przenosimy na dół strony,
przycisk „Zainstaluj” na telefonie zwijamy do ikony.

1. **Baner instalacji + podpowiedź iOS przeniesione z nagłówka na dół**, między
   `main` a `footer`. Na krótkich ekranach `main` ma `flex-1`, więc lądują przy
   dolnej krawędzi bez żadnego `position: fixed`.
2. **Przycisk „Zainstaluj” w nagłówku: sama ikona** (`hidden sm:inline` na
   tekście, `aria-label="Zainstaluj aplikację"`, `min-w-[44px]` — cel dotykowy
   zostaje pełny). Dzięki temu pasek mieści się w jednej linii.
3. **Panel „Przypomnienia na telefon” na Kontrolach zwinięty domyślnie** —
   pełna instrukcja miała 297 px i spychała listę w dół. Teraz cała linia jest
   przyciskiem („✓ włączone / Skonfiguruj”), a „Ukryj” działa też wtedy, gdy
   powiadomienia nie są jeszcze gotowe.

**Efekt zmierzony (ten sam ekran, ten sam stan „przed instalacją”):**

| | Przed | Po |
| --- | --- | --- |
| Nagłówek | 286 px | **121 px** (18%) |
| Pierwsza kontrola (Kontrole) | 531 px | **418 px** |
| Licznik „Zaległe” (Kontrole) | 720 px (poniżej ekranu) | **314 px** |
| Pierwsza kontrola (lista znamion) | 531 px | **366 px** |

**Zabezpieczenie: `e2e/ui-budget.spec.js`.** To nie zrzuty ekranu, a pomiar —
zrzuty zależą od czcionek i systemu, więc baseline z Windowsa nie zgadza się
z CI na Linuksie. Test pilnuje budżetu na 375×667: nagłówek ≤ 130 px na każdym
ekranie oraz pierwszy wiersz listy i licznik „Zaległe” nad linią zgięcia.
Wymusza przy tym stan „gotowe do instalacji” (`makeInstallable` wysyła
`beforeinstallprompt`), bo w przeglądarce testowej to zdarzenie nie leci —
bez tego test przechodziłby na zepsutym układzie.

Sprawdzone mutacją: test napisany **przed** naprawą był czerwony (nagłówek
286 px, licznik na 720 px), po naprawie zielony.

## Znane ograniczenie

Baner instalacji jest teraz **poniżej linii zgięcia** na dłuższych ekranach
(na liście znamion: 795 px przy 667 px okna). To świadomy koszt — nie zabiera
miejsca, ale łatwiej go przeoczyć. Ratują to: ikona „Zainstaluj” w nagłówku
oraz panel „Przypomnienia na telefon” na Kontrolach. Do rozważenia przy okazji
nawigacji (ticket 09): stały pasek na dole zamiast bloku w treści.
