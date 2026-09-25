# 02 — Segmentator: auto-przełączenie kroków czy ręczne tryby z lepszymi hintami

Type: grilling
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Po wykonaniu kroku 1 (skala) — czy `LesionSegmenter` ma sam przejść do kroku 2
(znamię) i odwrotnie, czy zostają dwa niezależne tryby z lepszymi
podpowiedziami?

Kontekst:

- `LesionSegmenter.jsx` trzyma `mode` = `'calibrate' | 'segment' | 'manual'`,
  przełączany ręcznie przyciskami „1. Skala (moneta)" / „2. Zaznacz znamię" /
  „Ręcznie (obrys)".
- Feedback użytkownika (problemy D/E): po obrysie nie wiadomo, że trzeba przejść
  do „zaznacz znamię" — info pojawia się dopiero po ręcznym wybraniu trybu.
- Tryb ręczny (`manual`) też wymaga skali — czy wpisuje się w tę samą sekwencję?

Odpowiedź steruje ticketem 09 (prowadzenie krokowe).

## Answer

Decyzja (potwierdzona przez użytkownika): segmentator przechodzi na
**dwukrokowy kreator** z auto-przejściem, a metoda zaznaczenia znamienia staje
się wyborem **wewnątrz kroku 2**.

1. **Auto-przejście** (nie jawny przycisk „Dalej"). Po ustawieniu 2 punktów
   skali segmentator sam aktywuje krok 2 i pokazuje komunikat „Skala ustawiona
   (X mm). Teraz: zaznacz znamię." Powrót do kroku 1 zawsze możliwy; punkty
   skali zostają widoczne na kanwie.
2. **Stała kolejność skala → znamię.** Pomiar i tak wymaga skali; odwrotny
   porządek (znamię → skala) odrzucony — wprowadzałby niejednoznaczny stan.
3. **„Ręcznie (obrys)" to metoda wewnątrz kroku 2**, nie osobny tryb najwyższego
   poziomu. Krok 2 ma przełącznik metody: „Automatycznie (AI)" / „Ręcznie (obrys)".

Efekt: znika mylące „trzy niezależne tryby"; kroki mają wskaźnik postępu
(„Krok 1 z 2 · Skala", „Krok 2 z 2 · Znamię"). Implementacja → ticket 09.
