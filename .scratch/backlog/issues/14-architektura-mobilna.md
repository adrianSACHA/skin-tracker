# 14 — Architektura mobilna: mniej ekranów, jasny kontekst osoby

Type: design
Status: needs-info
Map: .scratch/backlog/map.md

Zgłoszenie właściciela (2026-09-29), po sprawdzeniu aplikacji na telefonie.

## Zgłoszenie (cytat)

> zastanawiam się czy jest potrzeba trzymania listy znamion, kontroli i mapy.
> Flow powinno być dodajesz znamię, zaznaczasz gdzie dodajesz i wprowadzasz, a my
> mamy dodaj na mapie i później przechodzi dalej do mapy. Lista znamion pokazuje
> w sumie to samo co kontrola.
> Detale znamienia czyli karta według mnie jest bardzo rozproszona. Na początek
> jest dodaj zdjęcie, nad nim 3 kropki, obok kalendarz, a pod spodem zakładki
> (akurat tabsy są ok).
> Desktop i mobile: przy wejściu do apki mam wybierz osobę, ale jednocześnie
> zakładki mapa itp., i klikając mapa przechodzę na mapę — a co jeśli będę miał
> inny profil?

Uwaga: „tabsy są ok" — podział na zakładki (ticket 12 B) zostaje.

---

## Ustalenie 1 — „Lista znamion" i „Kontrole" pokazują prawie to samo

Sprawdzone w kodzie (`LesionsList.jsx` vs `Reminders.jsx`):

| Element na wierszu | Lista znamion | Kontrole |
| --- | --- | --- |
| Nazwa znamienia (z kontekstem okolicy) | tak | tak |
| Plakietka statusu | tak | tak |
| Termin kontroli (data) | tak (`Kontrola: <data>`) | tak |
| Link do szczegółów | tak | tak |
| Szukanie po nazwie/okolicy | tak | tak |
| „Usunięte" widoczne | tak | **nie** (`dueRows` je pomija) |
| Filtr po statusie, sortowanie | tak | nie |
| Interwał kontroli (ustawienie) | tak | nie |
| Względny czas („za 5 dni", „zaległe 3 dni") | nie | tak |
| Data przypomnienia, przesuń/przywróć termin | nie | tak |
| „Dodaj zdjęcie" z wiersza | nie | tak |
| Liczniki (zaległe / w ciągu 30 dni) | nie | tak |
| Panel powiadomień w tle | nie | tak |

**Wniosek: zgłoszenie jest trafne.** Oba ekrany odpowiadają na to samo pytanie
(„jakie mam znamiona i kiedy je kontrolować"), a Kontrole są informacyjnie
nadzbiorem. Nadmiar jest realny: dwa ekrany, dwa zestawy testów, dwa warianty
nawigacji.

### Opcje

- **A. Zostawić dwa** — bo mają różne zadania (przeglądanie vs. planowanie).
  Koszt: duplikacja i trzeci ekran w nawigacji, o którym i tak była dyskusja.
- **B. Zlikwidować „Listę znamion"** *(rekomendacja)* — zostają **Mapa** i
  **Kontrole**. Kontrole stają się jedyną listą: dochodzi filtr po statusie,
  sortowanie, przełącznik „pokaż usunięte", a interwał kontroli przenosi się do
  Kontrol (to jego naturalne miejsce — steruje terminami).
  Zysk: nawigacja schodzi do **dwóch** pozycji, znika duplikat, jedno miejsce do
  utrzymania i testowania. Koszt: trzeba dokończyć wchłanianie filtrów, a część
  pracy z effortu `lesion-list-filters` (6 ticketów) staje się zbędna.
- **C. Zlikwidować „Kontrole"** — zostaje Mapa i Lista, a akcje przypomnień
  wchodzą do karty znamienia. Koszt: tracimy jedyne miejsce „co mnie czeka",
  do którego prowadzą powiadomienia i znacznik w nawigacji.

---

## Ustalenie 2 — nawigacja nie wie, czyja jest osoba

**Zmierzone** (harness e2e, mock, 375×667 i 1280×900):

1. Wybieramy osobę „Ja" → `localStorage` zapisuje osobę.
2. Wracamy na ekran „Wybierz osobę" (pełne przeładowanie).
3. **Nawigacja jest tam widoczna** (Mapa / Znamiona / Kontrole) — mimo że osoba
   nie została jeszcze wybrana *w tej chwili*.
4. Kliknięcie „Mapa ciała" prowadzi do **poprzednio wybranej** osoby:
   `/person/person-1` → nagłówek „Mapa ciała — Ja".
5. Na telefonie **nie widać, która osoba jest aktywna**: wskaźnik
   `Osoba: <nazwa>` ma klasę `hidden … sm:inline`, więc poniżej 640 px jest
   ukryty. Etykiety zakładek są tam skrócone (`Mapa`, `Znamiona`, `Kontrole`).

**Ryzyko:** na telefonie możesz wejść w „Mapa ciała" z ekranu wyboru osoby,
nie widząc czyjejś dokumentacji, i **dodać znamię do nie tej osoby**. To nie
jest kosmetyka.

### Opcje

- **A. Osoba = kontekst** *(rekomendacja)*: nawigacja pojawia się **tylko**
  wewnątrz osoby (`/person/:id/*`); ekran wyboru osoby nie ma nawigacji. W
  nagłówku zawsze widać, w czyjej dokumentacji jesteś — na telefonie jako krótki
  przycisk („Ja ▾"), który prowadzi do zmiany osoby.
- **B. Osoba zawsze w nagłówku**: nawigacja niezależna od osoby, a przycisk
  „Ja ▾" przełącza kontekst. Więcej pracy, ale jeden spójny model dla wszystkich
  ekranów.

Minimalny wariant A (naprawia ryzyko, nie rusza struktury): ukryć nawigację na
ekranie wyboru osoby **i** pokazać nazwę osoby na telefonie jako klikalny
wskaźnik.

---

## Ustalenie 3 — góra karty znamienia nadal rozproszona

Zmierzone: nad zakładkami są **trzy pasy**: powrót + tytuł (z `⋯`), rząd akcji
(„+ Dodaj zdjęcie", „Do kalendarza"), pasek zakładek. Razem ~250 px.

### Opcje

- **A. Jeden pas** *(rekomendacja)*: tytuł + „+ Dodaj zdjęcie" + `⋯` w jednym
  wierszu; „Do kalendarza" i „Zmień status" wchodzą do `⋯` (jak w Kontrolach).
  Uwaga techniczna: `CalendarReminderButton` sam jest rozwijanym menu, więc
  zagnieżdżanie go w `⋯` jest złe — trzeba by wystawić z niego zwykłe pozycje
  menu (pobierz `.ics`, przesuń termin).
- **B. „+ Dodaj zdjęcie" do zawartości zakładki** (Przegląd / Zdjęcia). Góra
  zostaje: tytuł + `⋯`, potem zakładki. Koszt: na zakładce „Trend" nie ma jak
  dodać zdjęcia.
- **C. Zostawić, tylko „Do kalendarza" do `⋯`** — najmniejszy ruch.

---

## Ustalenie 4 — flow dodawania znamienia

Obecnie (Mapa ciała): wybierz widok → „**+ Dodaj znamię**" (tryb dodawania) →
dotknij mapy → pin powstaje z auto-nazwą → otwiera się panel pinu z akcjami
„Zobacz pełną historię" / „Przesuń" / „Edytuj". Czyli wszystko dzieje się **na
mapie**, a wejście w dane to osobne kliknięcie.

Zgłoszenie: „dodajesz znamię, zaznaczasz gdzie dodajesz i wprowadzasz".

### Do ustalenia

Czy po postawieniu pinu ma być **krok „wprowadź dane"** — np. od razu formularz
(nazwa, status, pierwsze zdjęcie) albo automatyczne przejście do karty
znamienia z podświetlonym „Dodaj zdjęcie"? Dziś użytkownik musi się domyślić, że
ma kliknąć „Zobacz pełną historię".

---

## Do decyzji właściciela

1. **Ustalenie 1:** likwidujemy „Listę znamion" (opcja B), zostawiamy dwa ekrany
   (A), czy likwidujemy „Kontrole" (C)?
2. **Ustalenie 2:** minimalny wariant A (ukryć nawigację na wyborze osoby +
   pokazać osobę na telefonie), czy pełny model A/B?
3. **Ustalenie 3:** jeden pas u góry (A), „Dodaj zdjęcie" w zakładce (B), czy
   tylko przenieść kalendarz (C)?
4. **Ustalenie 4:** czy po postawieniu pinu dodajemy krok „wprowadź dane"?

## Znalezione przy okazji (naprawione)

`LesionInfoPanel` (panel pinu na mapie) odsyłał do usuniętej sekcji:
„Usuń znamię w widoku szczegółów (sekcja «Zarządzanie»)" — a sekcję „Zarządzanie"
zlikwidowano w tickecie 12 A. Poprawione na: „(menu «⋯» obok nazwy)".
