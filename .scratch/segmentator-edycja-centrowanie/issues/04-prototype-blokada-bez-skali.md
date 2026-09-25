# 04 — Blokada pomiaru bez checkboxa „skala w kadrze": ukryty / wyszarzony / komunikat

Type: prototype
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Jak zablokować pomiar z obrysu, gdy użytkownik nie potwierdził, że w kadrze jest
skala? Warianty do porównania w prototypie:

- **ukryty** — przycisk „Pomiar z obrysu" pojawia się dopiero po zaznaczeniu
  checkboxa,
- **wyszarzony** — widoczny, nieaktywny, z wyjaśnieniem obok / tooltipem,
- **komunikat** — widoczny i klikalny, ale blokuje w środku jasnym komunikatem.

Kontekst:

- checkbox `hasScaleReference` istnieje w `PhotoUploadForm.jsx`, ale obecnie nie
  steruje dostępnością segmentatora.
- `LesionSegmenter.jsx` już pokazuje ostrzeżenie `!haveScale`, ale go nie blokuje.

Prototyp ma rozstrzygnąć wariant; odpowiedź steruje ticketem 10.

## Answer

Decyzja (potwierdzona przez użytkownika): wariant **„wyszarzony" — widoczny,
nieaktywny przycisk + wyjaśnienie obok**.

- Przycisk „Pomiar z obrysu" jest widoczny, ale `disabled`, dopóki checkbox
  `hasScaleReference` nie jest zaznaczony.
- Obok / pod spodem krótki powód: „Aby mierzyć z obrysu, zaznacz, że w kadrze
  jest skala (moneta / linijka)."
- **Odrzucone:** „ukryty" (użytkownik nie odkryje funkcji) oraz „komunikat"
  (wpuszcza do środka i odbija).
- **Świadomie odrzucona alternatywa:** rezygnacja z pre-checkboxa i blokada
  wyłącznie na kroku 1 kreatora — trzymamy zapis z mapy („niedostępny bez skali
  potwierdzonej w kadrze").
- Klikalny prototyp 3 wariantów nie był potrzebny — decyzja opisowa wystarczy;
  ewentualny mock zbudujemy przy implementacji, jeśli będzie wątpliwość.

Steruje ticketem 10.
