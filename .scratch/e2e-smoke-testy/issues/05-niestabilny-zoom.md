# 05 — Niestabilny test gestu zoomu

Type: task
Status: resolved
Map: .scratch/e2e-smoke-testy/map.md

## Problem

Znalezione przy okazji ticketu 04. Test „po przybliżeniu ten sam gest przesuwa
zdjęcie, a nie stronę" (`e2e/map-gestures.spec.js`) czerwienił się **ok. 1 na 3
pełne przebiegi** (2 awarie na 5 przebiegów w pomiarze), mimo że w izolacji
przechodził 3/3. Wyglądał na „wrażliwy na obciążenie", ale przyczyna była inna.

## Answer

**To nie było obciążenie, a krucha asercja.** Przechwycony komunikat:

```
Expected substring: "scale(1.5"
Received string:    "translate(-110.83px, -110.83px) scale(1.65)"
```

Test klikał „Przybliż" dwa razy i oczekiwał dokładnie `scale(1.5`. Tymczasem
`utils.zoomIn()` z `react-zoom-pan-pinch` **mnoży od bieżącej wartości**, a nie
ustawia wartości bezwzględnej (`scale * (1 + step)`). Gdy drugie kliknięcie
trafi w trwającą animację pierwszego, mnoży ona skalę pośrednią:

```
1,0 --animacja--> 1,44        (drugie klikniecie w trakcie)
1,1458 × 1,44 = 1,65          ← zamiast 1,44
```

Pod obciążeniem animacja trwa dłużej, więc trafienie w nią jest częstsze —
stąd pozór „wrażliwości na obciążenie". Asercja była wadliwa niezależnie od
maszyny; CI maskowało ją przez `retries: 1`.

**Poprawka** (`e2e/map-gestures.spec.js`):

- Jedno kliknięcie „Przybliż" zamiast dwóch — jedno wystarcza, żeby włączyć
  przesuwanie (reguła to „przybliżone czy nie", nie „o ile").
- Zamiast dokładnej wartości: `readScale()` wyciąga liczbę z `transform`,
  `waitForSettledZoom()` czeka, aż animacja się skończy (dwie identyczne skale
  pod rząd — max ~3 s), i dopiero wtedy leci gest.
- Asercja sprowadza się do `expect(zoom).toBeGreaterThan(1)` — czyli do
  właściwości, którą ten test ma sprawdzać.

**Weryfikacja:** 4 pełne przebiegi `npm run e2e` z rzędu — 38/38 zielone
(wcześniej 2 awarie na 5). Czekanie na koniec animacji ma dodatkowy zysk:
gest nie jest już wysyłany w trakcie animacji, więc test sprawdza to, co
zamierzał.

**Wniosek na przyszłość:** nie asertować dokładnych wartości transformacji
bibliotek animujących. Sprawdzać własność (`> 1`, „jest przesunięte"), albo
najpierw doczekać końca animacji.
