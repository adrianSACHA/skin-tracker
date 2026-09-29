# 12 — Ekran znamienia: za dużo treści naraz

Type: task
Status: needs-triage
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
