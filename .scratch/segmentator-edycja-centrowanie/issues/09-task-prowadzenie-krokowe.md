# 09 — Prowadzenie krokowe w segmentatorze

Type: task
Status: resolved
Blocked by: 02
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Co dostarcza

Sekwencyjne prowadzenie w `LesionSegmenter.jsx`: skala → znamię (albo odwrotnie),
z jasnym info, co robić teraz — zamiast dwóch niezależnych trybów, po których
użytkownik nie wie, jak zaznaczyć znamię. Kształt zgodny z decyzją z `02`.

## Kryteria akceptacji

- [x] Po wykonaniu kroku 1 widać wyraźną wskazówkę / następuje auto-przejście do kroku 2.
- [x] Użytkownik nie musi zgadywać, że trzeba kliknąć „Zaznacz znamię".
- [x] Tryb ręczny (obrys) wpisuje się w tę samą sekwencję albo jest wyraźnie
      oddzielony z własnym prowadzeniem.
- [x] Stan kroków spójny z decyzją z `02`.

## Comments

- Powstał z problemów **D** i **E** (zła kolejność kroków, brak przełączania).
- Zablokowany przez `02`.
- Zrealizowane razem z ticketem 10 (`LesionSegmenter.jsx`): kreator dwukrokowy — krok 1 skala → auto-przejście → krok 2 znamię; metoda „Automatycznie (AI) / Ręcznie (obrys)" WEWNĄTRZ kroku 2; wskaźnik „Krok N z 2"; powrót do kroku 1 możliwy. `npm run build` + `npm test` zielone.
