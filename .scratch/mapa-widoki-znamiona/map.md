# Wayfinder: Widoki ciała, nazwy znamion i porządek akcji na mapie

Effort: `.scratch/mapa-widoki-znamiona/`
Tickets: `.scratch/mapa-widoki-znamiona/issues/`

## Destination

Uporządkować flow wokół widoków ciała i znamion:

- Znamiona mają nazwy z prefiksem lokalizacji (np. `Tył-1`, `Plecy-prawa-1`),
  żeby dało się je rozróżnić na liście.
- Kolejność akcji na mapie ciała odpowiada realnemu flow: najpierw widok,
  potem znamię (Wariant B — kontekstowe renderowanie).
- `Zmień zdjęcie tła` / `Usuń zdjęcie tła` schowane w menu `⋯` w nagłówku,
  z modalem potwierdzenia dla akcji destrukcyjnych.
- `Usuń widok` dostępne z panelu ustawień widoku (nie z szybkiego menu),
  bo usuwa też wszystkie znamiona w widoku.
- Widoki ciała: dropdown z predefiniowanymi okolicami + możliwość dodania
  własnej nazwy / zmiany istniejącej.
- Ujednolicić nazwy statusów między widokami (patrz Decisions so far).
- Poprawić drobne P0/P1 z przeglądu Kontrole/Lista/Mapa (patrz ticket list).

## Decisions so far

### Z tej iteracji (widoki i znamię)

- **Nazwy znamion:** auto-generowane z prefiksu okolicy ciała + numer
  (`Tył-1`, `Plecy-prawa-1`). Użytkownik może nadpisać nazwę ręcznie.
- **Widoki:** dropdown z predefiniowanymi okolicami ciała + możliwość
  dodania własnej nazwy i zmiany istniejącej. Słownik, nie wolny tekst.
- **Kolejność akcji:** Wariant B — kontekstowe renderowanie.
- Brak widoków → tylko `+ Dodaj widok` (primary, duży).
- Są widoki → `+ Dodaj znamię` (primary) + `+ Dodaj widok` (secondary, mniejszy).
- **Akcje tła (`Zmień zdjęcie tła`, `Usuń zdjęcie tła`):** schowane w menu `⋯`
  w nagłówku widoku mapy. Modal potwierdzenia przy `Usuń zdjęcie tła`.
- **`Usuń widok`:** w panelu ustawień widoku (osobny ekran / modal z `⋯`),
  nie w szybkim menu. Modal potwierdzenia, bo usuwa też znamiona.

### Z poprzednich iteracji (nadal aktualne)

- Pkt 1–6 UX: wdrożone.
- Stack: React + Vite + Tailwind v4 + Supabase, HashRouter, GitHub Pages.
- Zasada: aplikacja nie diagnozuje, nie ocenia zmian. Disclaimerów nie usuwamy.
- Platforma główna: Chrome/Android.
- Edycja zdjęć i segmentator: osobna mapa (001).

### Ustalenia z przeglądu Kontrole/Lista/Mapa (do wdrożenia)

- **Ujednolicić nazwy statusów:** obecnie „Do pilnej konsultacji" (mapa)
  vs „Wymaga uwagi" (lista). Wybrać jedną — sugerowane „Wymaga uwagi"
  (krótsze, mniej alarmistyczne).
- **Badge'y liczbowe** `Zaległe: 0` i `W ciągu 30 dni: 0` — wyszarzyć, gdy 0
  (kolor = sygnał, zero = brak sygnału).
- **Link `← Mapa ciała`** przenieść nad tytuł `Lista znamion` (breadcrumb).
- **Ustawienia w `Kontrole`** (`Przypomnij`, `Interwał kontroli`) przenieść
  na dół widoku — najpierw treść (lista znamion), potem konfiguracja.
- **`Przejdź do kontroli →`** na karcie znamienia zmienić na
  `Zobacz kontrolę →` / `Szczegóły kontroli →` (data już jest, link nie planuje).
- **Badge `przesunięte`** doprecyzować: `data ręcznie przesunięta`.

### Rozstrzygnięcia Wayfindera (domknięte)

- **Słownik okolic ciała (01):** 17 predefiniowanych okolic w `src/lib/bodyAreas.js`;
  predefiniowanych nie usuwamy, można dodać własną. `view_name` = klucz słownika
  albo własna nazwa wprost.
  → `issues/01-grilling-slownik-okolic.md`
- **Prefiks znamienia (02):** niezmienny — zmiana nazwy widoku nie przepisuje
  `lesions.label`; nowe znamiona w widoku biorą nowy prefiks.
  → `issues/02-grilling-prefiks-po-zmianie.md`
- **Nazwa statusu (03):** „Wymaga uwagi" (poprawka legendy `BodyMap.jsx`).
  → `issues/03-grilling-nazwa-statusu.md`
- **Wariant B (04):** brak widoków → tylko `+ Dodaj widok` (primary, duży);
  są widoki → `+ Dodaj znamię` (primary) + `+ Dodaj widok` (secondary) + `⋯`.
  → `issues/04-prototype-wariant-b.md`
- **Menu `⋯` (05):** własny `OverflowMenu` (Escape / klik poza / powrót fokusu),
  reuse `ConfirmDialog` dla „Usuń zdjęcie tła".
  → `issues/05-prototype-menu-kropki.md`
- **Panel ustawień widoku (06):** modal (reuse wzorca), wejście z menu `⋯`.
  → `issues/06-prototype-panel-widoku.md`
- **`Usuń widok` (07):** usuwa wszystko po potwierdzeniu (modal z liczbą znamion);
  najpierw `lesions` (bo `body_map_id` jest `on delete set null`), potem
  `body_maps`, na końcu pliki z bucketu.
  → `issues/07-grilling-usun-widok.md`
- **Realizacja (taski 08–18):** wdrożone w `BodyMap.jsx`, `LesionsList.jsx`,
  `Reminders.jsx`, `src/lib/bodyAreas.js`, `src/lib/uploadPhoto.js`.
  `npm run build` + `npm test` (58) zielone.

## Not yet specified (mgła)

Pięć pierwszych pytań z mgły rozstrzygnięto (patrz „Decisions so far" i tickety
01–07). Pozostają dwie kwestie, świadomie **nieobjęte** tą iteracją:

- Czy nazwa znamienia po nadpisaniu ręcznym zachowuje prefiks okolicy
  (np. `Tył-3 → „znamię przy łopatce"` — czy nadal pokazujemy `Tył` jako
  kontekst)? Dziś: nadpisana nazwa jest używana wprost, bez doklejania prefiksu.
- Czy listy znamion pokazują prefiks + opis, czy tylko opis (jeśli nadpisany)?
  Dziś: pokazują zapisany `lesions.label` (prefiks tylko dopóki nie nadpisano).

## Notes

### Dosłowny feedback użytkownika (do zachowania kontekstu)

> „Przy liście znamion musi być jakiś id lub np przedrostek skąd ona jest czyli
> plecy-... Lub tył-.... Aby później wiedzieć gdzie to jest. Zastanawiam się że
> jest dodanie znamienia ale pod spodem jest a na dole jest tył. Bez dodania
> widoku i tak nie mogę dodać znamienia więc chyba kolejność jest nie taka.
> Obok przyciski jak zmień tło lub usuń zdjęcie tła powinno być ukryte
> w jakimś menu lub w szczegółach."
> „Ad1, widoki mam w dropdown, zdefiniowane. Też powinna być możliwość dodawania
> lub zmiany nazw. Ad2. Wariant b, ad3. Musi być modal, ad4. Może być w panelu."

### Kontekst techniczny

- Widoki ciała są już w dropdownie z predefiniowanymi wartościami — rozszerzyć
  o dodawanie i edycję nazw.
- `+ Dodaj znamię` jest nad `+ Dodaj widok` — zamienić / kontekstowo renderować.
- `Zmień zdjęcie tła` i `Usuń zdjęcie tła` to obecnie przyciski obok
  `+ Dodaj znamię` — schować w menu `⋯`.
- Nazwy znamion generowane obecnie z inputa użytkownika → kończą się
  duplikatami (`plecy-środek` vs `Plecy środek`).
- Statusy mają dwie nazwy w różnych widokach — ujednolicić.
- Modal potwierdzenia dla akcji destrukcyjnych: wzorzec istnieje (usuwanie
  znamienia w panelu szczegółów), użyć tego samego.

### Stan kodu (rozpoznanie przy założeniu mapy)

- `src/components/BodyMap.jsx`:
  - `VIEWS` = stała lista 6 widoków (`front`, `back`, `left`, `right`,
    `legs_front`, `legs_back`) — to **nie** jest jeszcze słownik okolic ciała.
  - Przyciski `+ Dodaj znamię` / `Zmień zdjęcie tła` / `Usuń zdjęcie tła`
    renderowane **bezwarunkowo** obok siebie w nagłówku (`<div className="flex items-center gap-2">`).
  - `availableViews` filtruje widoki **tylko te z `image_url`** → „Dodaj widok"
    pokazuje dropdown z pozostałych 6 pozycji `VIEWS`.
  - Legenda na dole hardkoduje `urgent: 'Do pilnej konsultacji'` (rozjazd ze
    `src/lib/status.js`, gdzie `urgent.label === 'Wymaga uwagi'`).
  - Nazwa znamienia pochodzi wyłącznie z inputa (`pending.label`) — bez prefiksu.
- `src/components/LesionsList.jsx`: link `← Mapa ciała` w prawym górnym
  nagłówku (`justify-between`), nie nad tytułem; ustawienia (filtr + sortowanie
  + interwał) w bloku tuż pod nagłówkiem; link `Przejdź do kontroli →` prowadzi
  do `/reminders`.
- `src/components/Reminders.jsx`: panel ustawień („Przypomnij", interwał)
  jest **na górze**, przed listą; badge `przesunięte` (surowe słowo);
  podsumowanie `Zaległe: N` / `W ciągu 30 dni: N` zawsze w kolorze.
- `src/lib/status.js` = jedyne źródło etykiet statusów (`STATUS_META`).
- `src/components/ConfirmDialog.jsx` = istniejący wzorzec modala potwierdzenia
  (użyty przy usuwaniu zdjęcia tła i znamienia).
- W bazie: `body_maps.view_name` (obecnie klucz z `VIEWS`), `lesions.body_map_id`,
  `lesions.label`. Brak tabeli słownika okolic.

## Out of scope

- Zmiana backendu (Supabase, RLS, bucket, signed URLs).
- Migracja na Laravela / React Native / Capacitor.
- Segmentator i edycja zdjęć (osobna mapa 001).
- Przypomnienia / Notification Triggers (wdrożone).
- AI do diagnozy / oceny zmian (sprzeczne z zasadą aplikacji).

## Tickets

| #  | Type      | Tytuł                                                                                             | Blocked by | Status   |
| -- | --------- | ------------------------------------------------------------------------------------------------- | ---------- | -------- |
| 01 | grilling  | [Pełny słownik okolic ciała + zasady dodawania własnych](issues/01-grilling-slownik-okolic.md)     | —          | resolved |
| 02 | grilling  | [Prefiks znamienia po zmianie nazwy widoku](issues/02-grilling-prefiks-po-zmianie.md)              | —          | resolved |
| 03 | grilling  | [Ujednolicenie nazwy statusu](issues/03-grilling-nazwa-statusu.md)                                 | —          | resolved |
| 04 | prototype | [Wariant B: kontekstowe renderowanie przycisków](issues/04-prototype-wariant-b.md)                  | —          | resolved |
| 05 | prototype | [Menu `⋯` + modal potwierdzenia dla akcji tła](issues/05-prototype-menu-kropki.md)                  | —          | resolved |
| 06 | prototype | [Panel ustawień widoku (ekran / modal / bottom sheet)](issues/06-prototype-panel-widoku.md)        | —          | resolved |
| 07 | grilling  | [`Usuń widok` przy znamionach: blokada czy usunięcie](issues/07-grilling-usun-widok.md)             | —          | resolved |
| 08 | task      | [Auto-generowanie nazw znamion z prefiksu + numer](issues/08-task-auto-nazwy-znamion.md)           | 01, 02     | resolved |
| 09 | task      | [Dropdown widoków: dodawanie i edycja nazw](issues/09-task-dropdown-widokow.md)                   | 01         | resolved |
| 10 | task      | [Wdrożenie Wariantu B na mapie ciała](issues/10-task-wariant-b-mapa.md)                            | 04         | resolved |
| 11 | task      | [Wdrożenie menu `⋯` z akcjami tła i modalem](issues/11-task-menu-kropki.md)                        | 05         | resolved |
| 12 | task      | [Wdrożenie panelu ustawień widoku z `Usuń widok`](issues/12-task-panel-widoku.md)                  | 06, 07     | resolved |
| 13 | task      | [Ujednolicenie nazw statusów między widokami](issues/13-task-nazwy-statusow.md)                    | 03         | resolved |
| 14 | task      | [Wyszarzenie badge'y liczbowych przy wartości 0](issues/14-task-badge-zero.md)                     | —          | resolved |
| 15 | task      | [Przeniesienie `← Mapa ciała` nad tytuł](issues/15-task-breadcrumb-lista.md)                       | —          | resolved |
| 16 | task      | [Przeniesienie ustawień na dół widoku `Kontrole`](issues/16-task-ustawienia-dol.md)                | —          | resolved |
| 17 | task      | [`Przejdź do kontroli →` → `Zobacz kontrolę →`](issues/17-task-label-kontroli.md)                  | —          | resolved |
| 18 | task      | [Badge `przesunięte` → `data ręcznie przesunięta`](issues/18-task-badge-przesuniete.md)            | —          | resolved |

## Frontier

Brak — **wszystkie 18 ticketów jest `resolved`**. Wayfinder domknięty.

Zrealizowane w `BodyMap.jsx`, `LesionsList.jsx`, `Reminders.jsx`,
`src/lib/bodyAreas.js`, `src/lib/uploadPhoto.js`. `npm run build` +
`npm test` (58) zielone.
