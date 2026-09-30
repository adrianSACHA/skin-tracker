# Changelog

Wszystkie istotne zmiany w aplikacji Skin Tracker. Format inspirowany
[Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

> To log wdrożeń — uzupełniany ręcznie po zakończeniu prac. Szczegóły techniczne
> (pełna historia commitów) są w `git log`.

## [Niezakończone] — 2026-09-27

### Dodane

- **Zrzuty ekranu w testach** (`e2e/visual/screens.spec.js`). 8 ekranów
  porównywanych pikselowo: logowanie, wybór osoby (z plakietką „zaległe”),
  lista znamion (filtry zwinięte i rozwinięte), mapa ciała (pulpit i 375×667)
  oraz **tryb ciemny**. Baseline jest **osobny dla każdej platformy**
  (`-win32.png` lokalnie, `-linux.png` w CI), więc zestaw jest zielony i na
  Windowsie, i w CI — bez Dockera. Czas jest **zamrożony**
  (`page.clock.setFixedTime`), bo ekrany pokazują terminy liczone od „dzisiaj”
  — inaczej wzorce psułyby się same po kilku miesiącach. Tolerancja
  `maxDiffPixelRatio: 0.01`. Gdy brakuje wzorca dla danej platformy, test
  **pomija się** — w CI brak wzorca jest błędem, a nie „zapisz i idź dalej”
  (pierwszy przebieg na Linuksie zaczerwienił build na 7 testach, dopóki tego
  nie złapano). Wzorce dla Linuksa generuje się ręcznie: workflow „Testy” →
  `update_visual_baselines`. Instrukcja: README → „Testy” → „Zrzuty ekranu”.

- **Naprawiony niestabilny test gestu zoomu.** `zoomIn()` mnoży skalę od
  bieżącej wartości, a test oczekiwał dokładnie `scale(1.5` — gdy drugie
  kliknięcie trafiało w trwającą animację, wychodziło `1.65` (około 1 czerwony
  przebieg na 3). Teraz jedno kliknięcie, czekanie na koniec animacji i
  asercja „skala > 1”.
- **Podsumowanie przebiegu przypomnień + tryb próbny.** Po każdym uruchomieniu
  workflow „Powiadomienia o kontrolach” na stronie przebiegu widać, ile
  powiadomień wysłano i **dlaczego nic nie poszło** (osobno „zbyt wcześnie”
  i „już przypomniane w tym cyklu” — to dwie różne przyczyny). Ręczne
  uruchomienie z opcją `force` wysyła powiadomienie próbne i **nie zużywa
  cyklu** przypomnień. Logika przypomnień wyszła ze skryptu do
  `src/lib/reminders.js` (15 testów) i korzysta z tego samego liczenia
  terminów co Kontrole w aplikacji — wcześniej była drugą, nietestowaną kopią.

- **Budżet UI jako test** (`e2e/ui-budget.spec.js`). Na 375×667 pilnuje, że
  nagłówek ≤ 130 px na każdym ekranie oraz że pierwszy wiersz listy i licznik
  „Zaległe” są nad linią zgięcia. Celowo pomiar, nie zrzut ekranu — liczby są
  deterministyczne, więc nie zależą od czcionek i systemu (baseline z Windowsa
  nie zgadza się z CI). Test wymusza stan „gotowe do instalacji”, bo bez tego
  przechodziłby na zepsutym układzie.

- **Szukanie w Kontrolach.** Pole „Szukaj kontroli” (nazwa znamienia albo
  okolica ciała) ze stanem w adresie (`?q=`), licznikiem „N z M” i osobnym
  komunikatem, gdy nic nie pasuje. Pasek „Zaległe / W ciągu 30 dni” zostaje
  całkowity, żeby zgadzał się ze znacznikiem przy „Kontrole”.

- **Mapa ciała — widoki z pełnego słownika okolic.** 17 predefiniowanych okolic
  ciała (`src/lib/bodyAreas.js`) w dropdownie; można też dodać własną nazwę
  okolicy i zmienić istniejącą. `body_maps.view_name` trzyma klucz słownika albo
  własną nazwę.
- **Auto-nazwy znamion z prefiksem okolicy** (`Tył-1`, `Plecy-prawa-1`), z
  możliwością nadpisania ręcznego. Numer = 1 + najwyższy istniejący w widoku.
- **Osobny ekran „Dodaj widok"** — w trakcie wyboru okolicy i wgrywania tła
  bieżący widok (mapa, zakładki) jest ukryty; powrót przez „← Mapa ciała".
- **Wybór źródła zdjęcia tła** — „Zrób zdjęcie" (aparat, `capture`) obok
  „Wybierz z plików"; to samo przy zdjęciu znamienia.
- **Skeleton ładowania widoku** (pasek narzędzi + zdjęcie z pinami) zamiast
  spinnera; zdjęcie wstępnie wczytywane, więc treść pod mapą nie „skacze".
- **Panel ustawień widoku** (z menu `⋯`) — zmiana nazwy okolicy oraz usunięcie
  widoku razem ze znamionami (z potwierdzeniem i liczbą znamion).
- **Kontekst okolicy przy nadpisanej nazwie znamienia** — `Okolica · nazwa`
  (np. `Tył · znamię przy łopatce`) na liście znamion, w Kontrolach, w panelu
  pina i w szczegółach. Okolica brana dynamicznie z widoku; auto-nazwy
  (`Tył-3`) bez zmian.
- **Przypomnienia in-app (wariant lekki)** — licznik zaległych/wkrótce kontroli
  przy „Kontrole" w nawigacji oraz opcjonalne powiadomienie przeglądarki przy
  otwarciu aplikacji (za zgodą, max raz dziennie). `.ics` do kalendarza zostaje.
- **Nowe logo (monogram „ST"):** ekran ładowania, nagłówek, favicon i manifest
  PWA; lżejsza animacja (puls) zamiast wirującego pierścienia.
- **Ikony PNG z monogramu „ST":** `icon-192` i `icon-512` z zaokrąglonymi
  narożnikami, osobna ikona maskowalna `icon-maskable-512` (tło do krawędzi, dla
  Android/launcherów) oraz `apple-touch-icon.png` dla iOS; podłączone w manifeście
  i w `index.html`.
- **Karta osoby — liczby i najbliższa kontrola.** Na ekranie wyboru osoby
  karta pokazuje, ile osoba ma znamion i zdjęć oraz kiedy wypada najbliższa
  kontrola (data na czerwono + plakietka „zaległe”, gdy termin już minął;
  „Brak znamion” dla świeżej osoby). Terminy liczy ta sama logika co Kontrole
  (`src/lib/summary.js` + `buildRows`), więc liczby na karcie nie rozjeżdżają
  się ze znacznikiem przy „Kontrole”.
- **Backlog uporządkowany.** Pomysły, które żyły tylko w rozmowie i w
  `docs/STAN.md` („Otwarte / do rozważenia”), trafiły jako tickety do
  `.scratch/backlog/` — 6 pozycji, każda z etykietą triage. Dwie okazały się
  już zrobione (Web Push na wielu urządzeniach, treść powiadomień) i są
  zapisane jako „nie wracać”.
- **Testy e2e (Playwright) + CI.** 18 „dymnych" testów w prawdziwej
  przeglądarce: logowanie, wybór/edycja/usunięcie osoby, mapa ciała z pinami,
  lista znamion (nazwy, statusy, wyszukiwanie i filtr w adresie), motyw oraz
  układ na telefonie. Backend Supabase jest **zamockowany**
  (`e2e/support/mock-supabase.js`) — bez bazy, konta i bez sekretów w CI.
  Osobny config `vite.config.e2e.js` (`envDir: false`) gwarantuje, że prawdziwy
  projekt Supabase nie jest używany (adres `https://e2e.invalid`). Workflow
  `.github/workflows/e2e.yml` uruchamia jednostkowe + e2e. Skrypty:
  `npm run e2e`, `npm run e2e:ui`, `npm run e2e:report`. Rozdział runnerów:
  `vitest.config.js` ogranicza jednostkowe do `src/**`, żeby Vitest nie
  próbował uruchamiać plików `e2e/*.spec.js` (te wymagają Playwrighta).
- **Wybór osoby — edycja:** zmiana nazwy osoby oraz usunięcie osoby (w menu
  „⋯" na karcie, z potwierdzeniem); usunięcie kasuje też znamiona, zdjęcia i
  pliki ze Storage. Do tego porcja UX logowania/uploadu/pomiaru.
- **Druga porcja UX:** logowanie na spójnych kolorach (slate), kompaktowe
  przyciski edycji zdjęcia (ikony na telefonie), krótsze etykiety kroków
  segmentatora.
- **Lista znamion — kondensacja i wyszukiwanie:** karta to 2 linie (nazwa +
  status, termin kontroli), cała klikalna; pole wyszukiwania po nazwie/okolicy
  (stan w URL). **Szczegóły znamienia:** Porównanie -> Zdjęcia -> Trend ->
  Zarządzanie (najczęściej używane na górze).
- **Instalacja — przypominacz:** baner co ~7 dni, gdy apka nie jest
  zainstalowana (z info, że bez instalacji nie ma powiadomień w tle); legenda
  statusów na mapie schowana pod „Kolory statusów".
- **Kontrole — uproszczone karty:** główna akcja „Dodaj zdjęcie" + „Do
  kalendarza" + menu „⋯" (Przesuń o N tyg., Przywróć wyliczoną datę). Panel
  „Przypomnienia na telefon" zwija się do jednej linii, gdy wszystko gotowe.
- **Lista znamion — zwijane filtry:** filtr po statusie, interwał i sortowanie
  są domyślnie schowane pod przyciskiem „Filtry" (z licznikiem aktywnych
  statusów); nad listą tylko zwięzły skrót.
- **Panel „Przypomnienia na telefon" w Kontrolach** — pokazuje status
  (instalacja / zgoda / powiadomienia w tle) i akcje, żeby włączyć push; wyjaśnia,
  że bez tego działają tylko przypomnienia w kalendarzu.
- **Przycisk „Zainstaluj" (PWA)** — dodanie aplikacji do ekranu początkowego
  w każdej chwili (przechwycony `beforeinstallprompt`, przycisk w nagłówku);
  ukryty, gdy aplikacja jest już zainstalowana. Service worker dostał handler
  `fetch` (wymóg instalowalności PWA). Na iOS/iPadzie (Safari) przycisk pokazuje
  instrukcję „Udostępnij → Dodaj do ekranu początkowego".
- **Powiadomienia w tle (Web Push)** — prawdziwy push, gdy aplikacja zamknięta.
  Nadawcą jest GitHub Actions (cron + `scripts/send-reminders.mjs`), bez własnego
  serwera i bez płatnych funkcji; subskrypcja i interwał w Supabase. Włączanie:
  Kontrole → „Powiadomienia w tle". Konfiguracja: sekcja „Przypomnienia w tle" w
  README.

### Zmienione

- **Ekran znamienia — akcje rzadkie w menu „⋯” i podział na zakładki.**
  Usuwanie znamienia i zmiana statusu przeniesione z widoku do menu (status
  jako pozycje z ✓, `aria-checked`); zniknęła stała czerwona sekcja
  „Zarządzanie” (186 px) i osobny akapit o interwale w rzędzie akcji.
  Treść podzielona na zakładki **Przegląd / Zdjęcia / Trend** ze stanem
  w adresie (`?tab=`), więc działa odświeżenie i podlinkowanie; wzorzec ARIA
  z obsługą strzałek. Cała treść renderowała się naraz (1359 px) — teraz
  największa zakładka to **499 px**. Doszło `e2e/lesion-detail.spec.js`
  (6 testów — ekran nie miał wcześniej żadnego pokrycia) i wzorzec zrzutu
  `09-znamie-przeglad`; budżet pilnuje zawartości zakładki (≤ 600 px),
  bo wysokość strony zdominował stały chrom aplikacji (ticket 13).

- **Strzałki nawigacyjne zamienione na zwykłe chevrony** — „← Mapa ciała”
  na „< Mapa ciała”, „Otwórz mapę ciała →” na „Otwórz mapę ciała >”
  (również powroty w szczegółach znamienia i separator kroków segmentatora).
  Nie ruszane: `▴`/`▾` przy zwijanych panelach (to wskaźniki zwijania),
  strzałka w zdaniu o zakresie rozmiaru na wykresie oraz `□↑` w instrukcji
  instalacji na iPhone (opisuje ikonę Udostępnij).

- **Nagłówek na telefonie: 286 → 121 px (43% → 18% wysokości ekranu).**
  Komunikaty o instalacji (baner „Zainstaluj aplikację…” i podpowiedź dla iOS)
  przeniesione z nagłówka na dół strony, przycisk „Zainstaluj” na wąskim
  ekranie to sama ikona (z `aria-label` i pełnym celem dotykowym), a panel
  „Przypomnienia na telefon” na Kontrolach jest domyślnie zwinięty do jednej
  linii (miał 297 px). Efekt: pierwsza kontrola na liście startuje na 366 px
  zamiast 531, a licznik „Zaległe” na Kontrolach jest wreszcie nad linią
  zgięcia (720 → 314 px).

- **Mapa ciała — układ akcji:** zakładki widoków na samej górze; „+ Dodaj widok"
  w strefie zakładek, „+ Dodaj znamię" przy mapie (akcje rozdzielone).
- **Menu `⋯`** pozycjonowane w kadrze ekranu (mobile) — nie wychodzi już poza
  lewą krawędź; dociągane przy zmianie rozmiaru/obrocie.
- **Etykieta pinu** przy krawędziach mapy wyrównuje się do pina (nie jest
  ucinana przez krawędź).
- **Ujednolicone nazwy statusów** („Wymaga uwagi") — legenda mapy i lista
  korzystają z jednego źródła (`src/lib/status.js`).
- **Lista znamion:** filtr po statusie i sortowanie po terminie kontroli, stan
  w URL; breadcrumb „← Mapa ciała" nad tytułem.
- **Kontrole:** ustawienia („Przypomnij", interwał) na dole widoku; badge'y
  `Zaległe`/`W ciągu 30 dni` wyszarzone przy zera; „Zobacz kontrolę →";
  badge „data ręcznie przesunięta".
- **Panel pina jako bottom sheet na telefonie** — wysuwany od dołu arkusz z
  przyciemnionym tłem i uchwytem; zamykany klikiem w tło, przyciskiem
  „Zamknij" oraz **przeciągnięciem w dół**; przy otwartym arkuszu tło się nie
  przewija (desktop bez zmian: kolumna z boku).
- **Szczegóły znamienia (mobile):** porównanie zdjęć przeciąganym uchwytem
  (suwak), czytelniejszy wykres (gęste daty się nie nakładają), powiększanie
  zdjęć z historii (lightbox) i responsywne miniatury.
- **Mobile UX (Lista / Kontrole):** menu „Do kalendarza" trzyma się kadru
  (nie wychodzi poza ekran), poprawione rozjechane wcięcia.
- **Modale jako bottom sheet na telefonie** — potwierdzenia i „Ustawienia widoku"
  wysuwają się od dołu (spójnie z panelem pinu); na desktopie bez zmian.
- **Mobile UX:** nawigacja i nagłówek zawijają się (koniec z poziomym
  przewijaniem po dodaniu licznika); etykieta pinu zawija długie nazwy; modale
  mają ograniczoną wysokość i przewijanie; po kliknięciu pinu na telefonie widok
  przewija się do panelu szczegółów.

### Naprawione

- **Panel pinu na mapie odsyłał do nieistniejącej sekcji.** Po przeniesieniu
  usuwania znamienia do menu „⋯” (ticket 12 A) podpowiedź w panelu pinu nadal
  mówiła „Usuń znamię w widoku szczegółów (sekcja «Zarządzanie»)” — a tej
  sekcji już nie ma. Teraz wskazuje menu „⋯” obok nazwy.

- **Nieudana wysyłka przypomnień nie zużywa już cyklu.** `last_reminded_at`
  zapisywało się po próbie wysyłki nawet wtedy, gdy **wszystkie** wysyłki
  padły — a wtedy przypomnienie na cały cykl przepadało bez śladu. Teraz
  zapis następuje tylko wtedy, gdy coś faktycznie wyszło.
- **Skrypt przypomnień wywalał się uruchamiany wprost przez Node.** Brak
  rozszerzeń `.js` w importach modułu przypomnień (`ERR_MODULE_NOT_FOUND`) —
  Vite i Vitest to tolerują, Node nie. Znalezione testem integracyjnym
  przed wypchnięciem; rozszerzenia dodane w całym łańcuchu importów.

- **Mapa ciała połykała gest przewijania.** Przy skali 1 (bez przybliżenia)
  nie dało się przewinąć strony, zaczynając przesunięcie palcem od zdjęcia —
  biblioteka zoomu przechwytywała gest, mimo że nie było czego przesuwać.
  Teraz przesuwanie zdjęcia jest wyłączone przy skali 1 (i nadal wyłączone
  przy przesuwaniu pina), a włączone po przybliżeniu — czyli działa tam,
  gdzie ma sens. Zmierzone: przed 0 px przewinięcia, po 285 px.

- **Znacznik przy „Kontrole” odświeża się sam.** Liczył się tylko przy zmianie
  osoby lub interwału, więc po zmianie statusu (albo dodaniu zdjęcia,
  przesunięciu terminu) pokazywał starą liczbę aż do przeładowania — na
  Kontrolach licznik na stronie i znacznik w nagłówku pokazywały dwie różne
  wartości. Nowy sygnał `notifyDueChanged()` (`src/lib/dueSignal.js`) plus
  przeliczanie przy zmianie ekranu i powrocie do aplikacji.
- **Menu „⋯” nie wychodzi już za dół ekranu.** `OverflowMenu` pilnował tylko
  pozycji poziomej, więc w Kontrolach (do 9 pozycji „Przesuń o N tyg.”)
  dolne pozycje były nieosiągalne, gdy przycisk był nisko na ekranie —
  pozycji `fixed` nie da się doscrollować stroną. Teraz menu wybiera stronę
  z większą ilością miejsca i ogranicza wysokość do tego, co się mieści.

- **Znamiona „Usunięte” przestały być zaległe.** Status „Usunięte” nie był
  nigdzie pomijany przy liczeniu terminów, więc oznaczone nim znamię dalej
  zawyżało znacznik przy „Kontrole”, trafiało na listę Kontroli, generowało
  powiadomienie in-app i Web Push, a kartę osoby robiło czerwoną
  („zaległe”). Nowy szew `dueRows()` (`src/lib/lesionView.js`) liczy terminy
  bez „Usuniętych” i jest używany w znaczniku, Kontrolach, karcie osoby oraz
  skrypcie przypomnień. `buildRows` bez zmian — lista znamion nadal pokazuje
  „Usunięte” (filtr po statusie działa).

- **„Taki widok już istnieje"** przy dodawaniu okolicy, której wiersz w
  `body_maps` istnieje bez zdjęcia tła — teraz tło jest dogrywane do tego wiersza.
- **`SignedImage`** nie pokazuje już zdjęcia poprzedniego znamienia przy zmianie
  wybieranego znamienia (zerowanie starego URL).
- **Znikające „skakanie" treści** przy przełączaniu widoku mapy (preload zdjęcia
  + rezerwacja wysokości skeletona wg realnego stosunku boków).
- **`body_maps.view_name`** — zdjęte ograniczenie do 6 starych kluczy
  (`front`/`back`/`left`/`right`/`legs_front`/`legs_back`) w
  `supabase/rls-setup.sql`. Wcześniej dodanie okolicy spoza tych 6 (np. `Kark`)
  kończyło się błędem bazy. **Wymaga ponownego uruchomienia `supabase/rls-setup.sql`
  w Supabase.**

### Uwaga

- Zmiany z tej sekcji zostały wdrożone; część z nich powstała jako szybkie
  poprawki UX (mobile) po zamknięciu iteracji `mapa-widoki-znamiona` i nie ma
  osobnych ticketów w `.scratch/`.
