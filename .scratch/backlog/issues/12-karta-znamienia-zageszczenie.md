# 12 — Ekran znamienia: za dużo treści naraz

Type: task
Status: resolved
Map: .scratch/backlog/map.md

## Problem

Zgłoszenie właściciela (2026-09-29): „nie podoba mi się wygląd na karcie
znamienia, też dużo się dzieje”.

Zmierzone na 375×667 (iPhone SE), jedno znamię z 3 zdjęciami:

| Ekran | Wysokość | Ile ekranów |
| --- | --- | --- |
| **Szczegóły znamienia** | **2244 px** | **3,4** |
| Karta na liście znamion | 72 px | — |

Sekcje ekranu znamienia (wysokości zmierzone):

| Sekcja | Wysokość | Przyciski |
| --- | --- | --- |
| Porównanie zdjęć | 559 px | 0 |
| Historia zdjęć | 410 px | 6 |
| Trend rozmiaru (mm) | 390 px | 0 |
| Zarządzanie (czerwone) | 186 px | 1 |
| **Razem na stronie** | **2244 px** | **10** |

Nad linią zgięcia (667 px) mieszczą się tylko nagłówek i „Porównanie zdjęć” —
po resztę trzeba przewinąć 2,4 ekranu.

Uwaga: karta na **liście** znamion to 72 px (dwie linie + plakietka statusu) i
wygląda czysto — zgłoszenie dotyczy najpewniej ekranu szczegółów.

## Co konkretnie „się dzieje”

1. **Wszystko rozwinięte naraz.** Cztery bloki (porównanie, historia, trend,
   zarządzanie) są widoczne jednocześnie — nie ma podziału na „najważniejsze”
   i „na życzenie”.
2. **„Zarządzanie” to stała, czerwona strefa zagrożenia** (186 px + akapit
   ostrzeżenia) na ekranie, gdzie usunięcie znamienia zdarza się rzadko.
   Wizualnie to **najgłośniejszy** element strony, a dotyczy najrzadszej akcji.
3. **Rząd „Akcje” miesza trzy rodzaje rzeczy:** akcję główną („+ Dodaj
   zdjęcie”), zdanie informacyjne („Interwał kontroli: co 6 tyg. (zmień na
   liście znamion)”) i menu do kalendarza.
4. **Kontrolka statusu siedzi w nagłówku** (select obok nazwy), mimo że status
   jest już pokazany jako plakietka.
5. **Powtarzane zastrzeżenie** o statusach („to prywatna organizacja, nie ocena
   medyczna”) jest i tutaj, i na liście znamion.

## Do decyzji (needs-triage)

- **A. Przenieść akcje rzadkie/nieodwracalne do menu `⋯`** — usuwanie znamienia,
  zmiana statusu, „Do kalendarza”. Wzorzec `⋯` **już istnieje** w aplikacji
  (akcje osoby, ustawienia widoku, karty w Kontrolach), więc to spójne i tanie.
  Zysk: ~186 px + zniknięcie czerwonego bloku + spokojniejszy nagłówek.
- **B. Podzielić ekran na zakładki** (np. Przegląd / Zdjęcia / Trend).
  Jeden ekran bez przewijania, ale nowy wzorzec nawigacji i więcej dotknięć.
- **C. Zostawić trzy bloki rozwinięte, tylko posprzątać drobiazgi** (rząd
  „Akcje”, kontrolka statusu, powtarzane zastrzeżenie). Najmniejszy ruch.
- **Odrzucone z góry:** wspólny wzorzec zwijanych paneli — ticket 06 jest
  `wontfix`, więc nie wprowadzamy zwijania jako rozwiązania.

## Propozycja

Zacząć od **A** (spójne z tym, co już jest w aplikacji, i usuwa najgłośniejszy
element), a **B** rozważyć dopiero, jeśli po A nadal będzie za dużo.
Po zmianie dołożyć pomiar do `e2e/ui-budget.spec.js` (wysokość ekranu
znamienia), żeby zagęszczenie nie wróciło niezauważone.

## Zrobione: A (2026-09-29)

Akcje rzadkie i nieodwracalne przeniesione do menu „⋯” (wzorzec już używany
w aplikacji — akcje osoby, ustawienia widoku, karty w Kontrolach):

- **status** — 5 pozycji jako `menuitemradio`, bieżąca oznaczona ✓
  (`OverflowMenu` dostał obsługę `item.checked` + `aria-checked`),
- **usunięcie znamienia** — pozycja `danger`; potwierdzenie bez zmian.

Sekcja **„Zarządzanie”** (186 px czerwonego bloku + akapit ostrzeżenia)
zniknęła z ekranu. Informacja o interwale trafiła do linii meta
(„Zdjęć: 3 · ostatnia: 20.05.2026 · kontrola co 6 tyg.”) zamiast osobnego
akapitu z linkiem w rzędzie akcji. Przy okazji usunięto **15 pustych linii**
zostałych w pliku po jakiejś wcześniejszej edycji.

Zmierzony efekt (375×667, znamię z 3 zdjęciami):

| | Przed | Po |
| --- | --- | --- |
| Wysokość ekranu | 2244 px | **1934 px** |
| Ile ekranów | 3,4 | **2,9** |

Czyli **−310 px**, ale to **nie rozwiązuje problemu**: sama treść (porównanie
559 px + historia 410 px + trend 390 px) to nadal ~2 ekrany.

Zabezpieczone nowym `e2e/lesion-detail.spec.js` (4 testy — ten ekran nie miał
wcześniej **żadnego** pokrycia) z budżetem wysokości **≤ 2150 px**, czyli
poniżej starej wartości: samo przywrócenie sekcji „Zarządzanie” wywali test.

## Zrobione: B — zakładki (2026-09-29)

Treść podzielona na trzy zakładki: **Przegląd / Zdjęcia / Trend**, stan w
adresie (`?tab=zdjecia`) — spójnie z filtrami listy znamion, więc zakładka
przeżywa odświeżenie i można ją podlinkować. Wzorzec ARIA
(`role="tablist"` / `tab` / `tabpanel`) z obsługą strzałek, Home i End.

Zmierzone zawartości zakładek (375×667):

| Zakładka | Zawartość |
| --- | --- |
| Przegląd (porównanie) | 499 px |
| Zdjęcia (historia + ABCDE) | 378 px |
| Trend (wykres) | 390 px |

Przed zmianami cała treść renderowała się naraz: **1359 px**. Teraz największa
zakładka to 499 px, czyli **2,7× mniej treści naraz**. Świadomie nie
wprowadzam zwijanych paneli — ticket 06 (`wontfix`) odrzucił wspólny wzorzec
zwijania.

Budżet w `e2e/lesion-detail.spec.js` pilnuje **zawartości zakładki**
(≤ 600 px), a nie wysokości strony: poza nią jest stały chrom aplikacji
(~600 px), identyczny na każdym ekranie. Pilnowanie wysokości strony
mieszałoby zmiany w chromie ze zmianami treści.

## Answer

A + B zrobione. Ekran: 2244 px i cztery sekcje widoczne naraz → trzy zakładki
po ≤ 499 px zawartości, każda z własnym stanem w adresie. Doszło
`e2e/lesion-detail.spec.js` (6 testów — ekran nie miał wcześniej żadnego
pokrycia) oraz wzorzec zrzutu `09-znamie-przeglad`.

**Konsekwencja, która wyszła z pomiaru:** Przegląd nadal wymaga ~0,6 ekranu
przewijania, ale to zasługa **chromu** (nagłówek, stopka, powrót, tytuł, rząd
akcji, pasek zakładek), nie treści znamienia → osobny ticket 13.
