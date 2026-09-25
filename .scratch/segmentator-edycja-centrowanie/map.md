# Wayfinder: Segmentator, edycja zdjęć i centrowanie znamion

Effort: `.scratch/segmentator-edycja-centrowanie/`
Tickets: `.scratch/segmentator-edycja-centrowanie/issues/`

## Destination

Poprawić flow dodawania zdjęcia i pomiaru z obrysu w Skin Trackerze:

- Dodać możliwość edycji zdjęcia po wybraniu (obecnie nie ma edycji).
- Usunąć mylącą etykietę „opcjonalny" przy pomiarze z obrysu — bez skali i tak
  nic nie policzy, więc „opcjonalny" wprowadza w błąd.
- Zmienić etykiety skali tak, żeby uwzględniały linijkę, nie tylko monetę
  („1. Skala (moneta)" → moneta/linijka).
- Przebudować kolejność kroków w segmentatorze na sekwencyjne prowadzenie,
  z jasnym info, co robić teraz (skala → znamię, albo odwrotnie), zamiast
  dwóch niezależnych trybów, po których użytkownik nie wie, jak zaznaczyć znamię.
- Zablokować pomiar z obrysu, jeśli na zdjęciu nie ma skali (checkbox / jawny warunek).
- Wycentrować znamię w kadrze porównania — teraz przy porównaniu nie widać
  dobrze i ciężko porównać; powinno samo się dostosowywać do centralnego punktu
  albo mocniej obcinać kadr.
- Zdecydować, czy i gdzie wchodzi AI do rozpoznawania/opisywania znamion.

## Decisions so far

- Pkt 1 (mapa, hierarchia przycisków): wdrożone.
- Pkt 2 (legenda kolorów): wdrożone — popover.
- Pkt 3 (panel pina): wdrożone — hierarchia akcji.
- Pkt 4 (etykiety porównania): wdrożone — „wcześniejsze"/„późniejsze".
- Pkt 5 (wejście do segmentatora): wdrożone.
- Pkt 6 (przypomnienia): wdrożone — SW + feature detection + fallback kalendarza.
- Stack: React + Vite + Tailwind v4 + Supabase, HashRouter, GitHub Pages.
- Zasada: aplikacja nie diagnozuje, nie ocenia zmian. Disclaimerów nie usuwamy.
- Platforma główna: Chrome/Android.
- LesionSegmenter już istnieje i działa — nie przepisujemy modelu, tylko flow wokół niego.
- **Pkt 7 — segmentator (ticket 02, resolved):** dwukrokowy kreator z auto-przejściem
  skala → znamię (stała kolejność); metoda „Automatycznie (AI) / Ręcznie (obrys)"
  wewnątrz kroku 2, nie jako osobne tryby.
  → `.scratch/segmentator-edycja-centrowanie/issues/02-grilling-segmentator-kroki.md`
- **Pkt 8 — skala „moneta / linijka" (ticket 03, resolved):** krok 1 = „Skala (moneta / linijka)"; pola i komunikaty bez założenia monety; „Średnica monety (mm)" → „Długość odcinka referencyjnego (mm)".
  → `.scratch/segmentator-edycja-centrowanie/issues/03-grilling-etykiety-skali.md`
- **Pkt 9 — blokada bez skali (ticket 04, resolved):** przycisk pomiaru wyszarzony + wyjaśnienie, dopóki checkbox `hasScaleReference` niezaznaczony.
  → `.scratch/segmentator-edycja-centrowanie/issues/04-prototype-blokada-bez-skali.md`
- **Pkt 10 — edycja zdjęcia / crop (ticket 01, resolved):** obrót / flip / reset = własny `<canvas>`, bez zależności; interaktywny crop = `react-easy-crop` (~7,3 kB gzip, typy, a11y) — **warunkowo**, jeśli 05/11 nie rozstrzygną auto-kadrowania z maski.
  → `.scratch/segmentator-edycja-centrowanie/issues/01-research-cropper.md`
- **Pkt 11 — auto-kadrowanie z maski (ticket 05, resolved):** bbox z maski / obrysu → kadr **kwadratowy**, padding 25%, clamp do granic, fallback `null`; stosowany przy zapisie (bez zmian schematu). Prototyp: `.scratch/segmentator-edycja-centrowanie/prototype/cropBox.mjs`.
  → `.scratch/segmentator-edycja-centrowanie/issues/05-prototype-auto-kadrowanie.md`
- **Pkt 12 — wykrywanie monety / linijki (ticket 06, resolved):** MediaPipe Object Detector (COCO) **nie ma klas** `coin` / `ruler` → out-of-the-box nie wykryje. Baseline = ręczna kalibracja 2-punktowa; ewentualnie reuse `InteractiveSegmenter` (klik w monetę). Bez nowego modelu dodanego teraz.
  → `.scratch/segmentator-edycja-centrowanie/issues/06-research-mediapipe-moneta.md`
- **Pkt 13 — decyzja o AI (ticket 07, resolved):** **A + B** — tylko geometria lokalna (auto-kadr z maski). Odrzucone: generowany opis ABCDE (C) oraz „pokazać lekarzowi" jako AI (D dopuszczone wyłącznie regułowo). Bez LLM i nowych modeli.
  → `.scratch/segmentator-edycja-centrowanie/issues/07-grilling-decyzja-ai.md`

## Not yet specified (mgła)

Wszystkie pytania z pierwotnej mgły rozstrzygnięto (patrz „Decisions so far").
Pozostaje jedno, poza zakresem tego wayfindera:

- Czy manifest PWA jest już dodany (potrzebny dla Notification Triggers na
  Androidzie)? — wisi osobno.

## Notes

### Dosłowny feedback użytkownika (do zachowania kontekstu)

> „Nie podoba mi się dodawanie zdjęcia w sensie nie ma edycji, po co dawać
> opcjonalnie pomiar z obrysu skoro jest info że jeżeli nie będzie skali to tego
> nie policzy czyli muszę mieć skalę, po co pisać w zakładce moneta skoro może
> być linijka, kolejność jest nie taka, zaznaczam obrys i chcę iść dalej a tu
> mam info że trzeba zaznaczyć znamię ale nie wiem jak, dopiero wybierając
> zaznacz znamię mam to. Nie intuicyjne. Wolałbym aby było przełączenie że jak
> zaznaczę skalę to od razu jest jakieś info że później znamię lub odwrotnie.
> Nie powinno być dostępne jeżeli na zdjęciu nie ma skali. Więc taki chcecie
> bozlx z że jest skala na zdjęciu jeżeli nie trzeba podać wielkość. Jeszcze bym
> chciał aby znamię było na centralnym miejscu zdjęcia. W tej chwili jak porównuje
> to nie widać dobrze i ciężko porównać. Powinno albo samo się dostosowywać
> w centralnym punkcie lub jakoś moc obcinać to. Zastanawiam się czy nie dać
> jakiegoś agenta aby jednak rozpoznawał lub cos tam pisał o tym."

### Rozbicie na problemy (do wykorzystania przy ticketach)

- **A.** Brak edycji zdjęcia po dodaniu (kadrowanie / obrót / reset).
- **B.** „Pomiar z obrysu (opcjonalny)" mylące — skoro bez skali nic nie policzy.
- **C.** „1. Skala (moneta)" zakłada monetę, a bywa linijka (widać na zrzucie).
- **D.** Zła kolejność kroków: po zaznaczeniu obrysu brak prowadzenia do „zaznacz znamię".
- **E.** Brak przełączania skala ↔ znamię (sekwencyjne prowadzenie zamiast niezależnych trybów).
- **F.** Pomiar z obrysu powinien być niedostępny bez skali potwierdzonej w kadrze.
- **G.** Znamię nie jest wycentrowane — porównanie na sliderze jest nieskuteczne.
- **H.** Pomysł na agenta AI do rozpoznawania/opisywania znamion (wymaga decyzji).

### Kontekst techniczny

- `LesionSegmenter.jsx`: kroki „1. Skala (moneta)" / „2. Zaznacz znamię" / „Ręcznie (obrys)";
  przyciski „Zatwierdź obrys", „Anuluj pomiar"; ostrzeżenie o braku skali.
  Tryb trzymany w `mode` = `'calibrate' | 'segment' | 'manual'`, przełączany ręcznie.
- Checkbox „W kadrze znajduje się skala referencyjna (moneta / linijka)" istnieje
  w `PhotoUploadForm.jsx` (`hasScaleReference`), ale nie steruje dostępnością segmentatora.
- Pole „Rozmiar (mm, opcjonalnie)" (`size-mm`) jest obok — użytkownik nie wie, czy to
  alternatywa dla segmentatora, czy osobna ścieżka.
- Porównanie zdjęć w `LesionDetail.jsx`: dwie warstwy `object-contain` na
  `aspect-[3/4]` + suwak przezroczystości — stąd brak centrowania znamienia.
- MediaPipe / LesionSegmenter może dostarczyć maskę → bounding box → auto-kadrowanie.
- `@mediapipe/tasks-vision` = 1.0.1. Już użyte zależności: `react-zoom-pan-pinch` (4.2.0),
  `browser-image-compression` (0.2.2) — istotne przy decyzji o cropperze.
- Nie dodajemy zależności bez uzasadnienia.
- RODO/wrażliwe dane: każde AI w chmurze wymaga polityki prywatności i zgody.
  Lokalne modele (transformers.js / WebLLM) bezpieczniejsze prawnie, ale słabsze.

## Out of scope

- Zmiana backendu (Supabase, RLS, bucket, signed URLs).
- Migracja na Laravela / React Native / Capacitor.
- Zmiany w mapie ciała, panelu pina, przypomnieniach (wdrożone).
- AI do diagnozy / oceny zmian (sprzeczne z zasadą aplikacji, patrz ADR-0001).

## Tickets

| #  | Type       | Tytuł                                                              | Blocked by | Status   |
| -- | ---------- | ------------------------------------------------------------------ | ---------- | -------- |
| 01 | research   | [Cropper: `react-easy-crop` czy własny crop na `<canvas>`](issues/01-research-cropper.md) | — | resolved |
| 02 | grilling   | [Segmentator: auto-przełączenie kroków czy ręczne tryby](issues/02-grilling-segmentator-kroki.md) | — | resolved |
| 03 | grilling   | [Etykiety skali: „moneta / linijka" i „Długość odcinka referencyjnego"](issues/03-grilling-etykiety-skali.md) | — | resolved |
| 04 | prototype  | [Blokada bez checkboxa „skala w kadrze": ukryty / wyszarzony / komunikat](issues/04-prototype-blokada-bez-skali.md) | — | resolved |
| 05 | prototype  | [Auto-kadrowanie z maski segmentatora (bounding box + padding)](issues/05-prototype-auto-kadrowanie.md) | — | resolved |
| 06 | research   | [Czy MediaPipe Object Detector wykryje monetę / linijkę](issues/06-research-mediapipe-moneta.md) | — | resolved |
| 07 | grilling   | [Decyzja o AI: brak / CV / opis ABCDE / „pokazać lekarzowi"](issues/07-grilling-decyzja-ai.md) | — | resolved |
| 08 | task       | [Edycja zdjęcia (obrót, flip, reset, ew. crop)](issues/08-task-edycja-zdjecia.md) | 01 | resolved |
| 09 | task       | [Prowadzenie krokowe w segmentatorze](issues/09-task-prowadzenie-krokowe.md) | 02 | resolved |
| 10 | task       | [Blokada segmentatora bez skali](issues/10-task-blokada-segmentatora.md) | 04 | resolved |
| 11 | task       | [Centrowanie znamienia w kadrze porównania](issues/11-task-centrowanie-znamienia.md) | 05 | resolved |

## Frontier

Brak — **wszystkie 11 ticketów jest `resolved`**. Wayfinder domknięty.

Zrealizowane zadania: `08` (edycja zdjęcia), `09` (prowadzenie krokowe),
`10` (blokada bez skali), `11` (centrowanie). `npm run build` + `npm test` (31)
zielone. Pozostaje ewentualny smoke-test w przeglądarce (wymaga logowania i danych).
