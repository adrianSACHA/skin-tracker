# Changelog

Wszystkie istotne zmiany w aplikacji Skin Tracker. Format inspirowany
[Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

> To log wdrożeń — uzupełniany ręcznie po zakończeniu prac. Szczegóły techniczne
> (pełna historia commitów) są w `git log`.

## [Niezakończone] — 2026-09-27

### Dodane

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
