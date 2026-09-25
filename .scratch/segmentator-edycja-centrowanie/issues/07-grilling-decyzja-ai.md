# 07 — Decyzja o AI: brak / auto-kadrowanie i wykrywanie skali / opis techniczny ABCDE / „pokazać lekarzowi"

Type: grilling
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Czy i gdzie wchodzi AI do rozpoznawania/opisywania znamion? Warianty do rozważenia:

- **brak AI** — tylko geometria (status quo),
- **auto-kadrowanie i wykrywanie skali** — lokalne CV (maska segmentera, detekcja
  monety/linijki),
- **opis techniczny ABCDE** — generowany tekst na podstawie zdjęcia/notatek,
- **sugestia „pokazać lekarzowi"** — bez oceny, tylko wskazanie, że warto
  skonsultować.

Konsekwencje do rozważenia:

- **ADR-0001**: aplikacja nie diagnozuje i nie ocenia zmian. Każdy wariant
  sugerujący ocenę jest z nim sprzeczny; disclaimerów nie usuwamy.
- **RODO**: AI w chmurze = polityka prywatności + zgoda użytkownika + proxy.
  Lokalne modele (transformers.js / WebLLM) bezpieczniejsze prawnie, ale słabsze.
- **Koszty i utrzymanie**: proxy/API, rozmiar modelu, opóźnienia.

Powiązane: 05 (auto-kadrowanie z maski), 06 (czy MediaPipe wykryje monetę).

## Answer

Decyzja (potwierdzona przez użytkownika): **A + B — tylko geometria lokalna.**

- **A (brak AI) — tak.** Poza poniższym „inteligencja" w UI = lokalna segmentacja
  (geometria), nie ocena znamienia.
- **B (lokalne CV) — tak.** Auto-kadrowanie z maski segmentatora (bbox + kwadrat +
  padding, jak w `05`). On-device, bez chmury — zgodne z ADR-0001.
- **C (generowany opis ABCDE) — odrzucone.** Ześlizguje się w ocenę (łamie
  ADR-0001) i ciąga RODO / zgodę / proxy / koszty. Bez „furtki na chmurę".
  Ewentualny powrót do C *lokalnie* (transformers.js) wymaga **nowej** decyzji —
  nie zapisujemy go jako zobowiązania.
- **D („pokazać lekarzowi") — dopuszczone tylko jako reguła, nie AI.**
  Deterministycznie (termin kontroli minął / zbliża się) — to już realizują
  przypomnienia. **Nie** czytamy zdjęcia, by sugerować konsultację.

**Konsekwencja praktyczna:** nie dodajemy żadnego LLM ani nowego modelu AI;
`@mediapipe/tasks-vision` pozostaje jedynym modelem (segmentacja = geometria).
Uwaga na copy UI: słowo „AI" przy kroku 2 dotyczy segmentacji lokalnej, nie oceny.
