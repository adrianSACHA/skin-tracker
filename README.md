# Skin Tracker

Osobista aplikacja do **systematycznej, fotograficznej dokumentacji znamion /
zmian skórnych** (u mnie i u syna). Służy do zapisu zdjęć w czasie i ich
porównywania — nic więcej.

> ⚠️ **To NIE jest wyrób medyczny i nie diagnozuje.** Aplikacja nie ocenia
> charakteru zmian i nie podaje żadnego „risk score". Statusy (`new`, `stable`,
> `watch`, `removed`, `urgent`) oraz kolory to wyłącznie Twoja prywatna
> organizacja notatek. Decyzje medyczne zawsze podejmuj z lekarzem.

---

## Model bezpieczeństwa (przeczytaj — to ważne)

- **Kod frontendu jest publicznie dostępny** pod adresem GitHub Pages (HTML/JS
  pobiera się do przeglądarki — nie da się tego ukryć).
- **GitHub Pages z prywatnego repo:** pełna prywatność *samej strony* wymaga
  płatnego planu **GitHub Pro**. Na planie darmowym strona może być publicznie
  dostępna pod adresem `https://adrianSACHA.github.io/skin-tracker/`.
- **Bezpieczeństwo danych opiera się na logowaniu (Supabase Auth) + RLS**, a
  **NIE** na ukryciu adresu strony. Bez zalogowania nie da się odczytać żadnych
  danych — pilnuje tego Row Level Security na każdej tabeli i na Storage.
- **Bucket Storage jest prywatny.** Zdjęcia są dostępne wyłącznie przez
  **signed URL** (wygasają po 1 godzinie).
- **Klucz `anon`** Supabase trafia do builda frontendu — to jest normalne i
  bezpieczne, o ile **RLS jest włączone**. **Nigdy** nie używaj w frontendzie
  klucza `service_role` i **nigdy nie commituj pliku `.env`**.

Podsumowanie: *kod jawny, dane chronione przez auth + RLS — nie przez ukrycie
adresu.*

---

## Stack

- **React 18 + Vite**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router** (`HashRouter` — brak problemów z odświeżaniem na GitHub Pages)
- **Supabase**: Postgres + Auth + Storage (darmowy tier)
- **browser-image-compression** (kompresja zdjęć w Web Workerze)
- **add-to-calendar-button** (przypomnienia bez backendu)
- **Recharts** (trend rozmiaru w mm)

---

## Struktura projektu

```
.
├── .env.example                     # placeholdery zmiennych Supabase (do skopiowania)
├── env.example                      # ← patrz uwaga w sekcji 3
├── .github/workflows/deploy.yml     # build + publikacja na GitHub Pages
├── index.html
├── package.json
├── vite.config.js                   # base: '/skin-tracker/'
├── supabase/rls-setup.sql           # schemat + RLS + prywatny bucket
└── src
    ├── App.jsx                      # routing
    ├── main.jsx                     # HashRouter + rejestracja web componentu
    ├── index.css                    # Tailwind + wariant trybu ciemnego
    ├── context/PersonContext.jsx    # wybrany profil (Ja/Syn)
    ├── context/ThemeContext.jsx     # tryb jasny/ciemny (+ zapis w localStorage)
    ├── lib
    │   ├── supabase.js              # klient Supabase
    │   ├── uploadPhoto.js           # kompresja + upload + signed URL + usuwanie plików
    │   ├── status.js                # statusy i kolory
    │   ├── date.js                  # helpery dat
    │   └── interval.js              # interwał kontroli (localStorage)
    └── components
        ├── AuthGate.jsx             # blokada aplikacji bez sesji
        ├── Login.jsx
        ├── AppToaster.jsx           # toasty (sonner, motyw jasny/ciemny)
        ├── LoadingFallback.jsx
        ├── Layout.jsx               # nagłówek + nawigacja + stopka
        ├── ThemeToggle.jsx          # przełącznik trybu jasny/ciemny
        ├── PersonSelector.jsx       # wybór profilu
        ├── BodyMap.jsx              # mapa ciała: zoom/pan + piny (dodaj/przesuń/edytuj)
        ├── LesionDetail.jsx         # szczegóły + porównanie + kalendarz + "Zarządzanie"
        ├── LesionSegmenter.jsx      # pomiar z obrysu (MediaPipe, tylko geometria)
        ├── PhotoUploadForm.jsx      # upload + ABCDE + pomiar z obrysu
        ├── LesionsList.jsx          # lista + kalendarz przypomnień
        ├── CalendarReminderButton.jsx
        ├── ConfirmDialog.jsx        # modal potwierdzenia (akcje destrukcyjne)
        ├── SignedImage.jsx          # signed URL → <img>
        └── StatusBadge.jsx
```

---

## 1. Utworzenie repozytorium na GitHub

1. Wejdź na <https://github.com/new>.
2. **Repository name:** `skin-tracker`
3. **Visibility:** **Private**
4. **Nie** dodawaj README/gitignore (mamy je w projekcie).
5. Utwórz repo, a następnie wypchnij projekt:

```bash
git init
git add .
git commit -m "Faza 1: MVP Skin Tracker"
git branch -M main
git remote add origin https://github.com/adrianSACHA/skin-tracker.git
git push -u origin main
```

> Nazwa repo **musi** się zgadzać z `base` w `vite.config.js` (`/skin-tracker/`).
> Jeśli nazwiesz repo inaczej — zmień `base` na `/<nowa-nazwa>/`.
>
> ⚠️ Przed pierwszym push upewnij się, że `.env` **nie** jest commitowany
> (`git status` nie może go pokazywać). Plik `.env` jest w `.gitignore`.

---

## 2. Konfiguracja Supabase

1. Utwórz projekt na <https://supabase.com/dashboard> (darmowy tier).
2. **Project Settings → API** — skopiuj **Project URL** i **anon/public key**.
3. **SQL Editor → New query** — wklej całą zawartość
   [`supabase/rls-setup.sql`](supabase/rls-setup.sql) i kliknij **Run**.
   Skrypt tworzy tabele, polityki RLS oraz **prywatny** bucket
   `lesion-photos`. Jest idempotentny — można go uruchamiać ponownie.
4. **Authentication → Users → Add user** — utwórz **jeden** użytkownik (swój
   email + hasło). Zaznacz **Auto Confirm User** (albo potwierdź email przez
   link).
5. Skopiuj **UID** tego użytkownika (Authentication → Users).
6. Utwórz dwa profile. Albo przez UI aplikacji (przycisk „Dodaj profil" na
   ekranie wyboru profilu), albo od razu w SQL:

```sql
insert into public.monitored_persons (owner_user_id, display_name)
values
  ('<TWOJE-UID>', 'Ja'),
  ('<TWOJE-UID>', 'Syn');
```

7. (Opcjonalnie) **Authentication → Providers → Email** — możesz wyłączyć
   rejestrację nowych użytkowników, jeśli chcesz mieć pewność, że nikt się nie
   zapisze.

### Struktura danych (po co jest RLS)

```
auth.users (moje konto)
  └── monitored_persons (owner_user_id)         „Ja" / „Syn"
        └── body_maps (person_id)               zdjęcie referencyjne (przód/tył/boki/nogi)
        └── lesions (person_id, body_map_id)    znamię: label, pos_x, pos_y, status
              └── lesion_photos (lesion_id)     zdjęcia + rozmiar + ABCDE
```

Każda polityka RLS sprowadza się do łańcucha `… → person → owner_user_id =
auth.uid()`. Właścicielem danych jesteś tylko Ty.

Zdjęcia w Storage mają ścieżki
`{auth.uid()}/{person_id}/{lesion_id}/{plik}` (a dla tła mapy ciała
`{auth.uid()}/{person_id}/body-map/{view}.webp`). RLS dopuszcza dostęp tylko,
gdy pierwszy folder = `auth.uid()`.

---

## 3. Uruchomienie lokalne

```bash
npm install
```

Utwórz plik `.env` w katalogu głównym (skopiuj z `env.example` / `.env.example`):

```
VITE_SUPABASE_URL=https://TWOJ-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-anon-public-key
```

> **Uwaga:** w tym repozytorium plik z przykładami nazywa się `env.example`
> (bez kropki), bo narzędzie, którym generowano projekt, blokowało pliki
> zaczynające się od `.env`. Zmień nazwę na `.env.example` albo od razu
> utwórz `.env`.

Uruchom dev-serwer:

```bash
npm run dev
```

Build produkcyjny:

```bash
npm run build
npm run preview
```

---

## 4. Sekrety w GitHub Actions

**Repo → Settings → Secrets and variables → Actions → New repository secret**.
Dodaj dwa:

| Name                     | Value                                   |
| ------------------------ | --------------------------------------- |
| `VITE_SUPABASE_URL`      | Project URL z Supabase                  |
| `VITE_SUPABASE_ANON_KEY` | anon/public key z Supabase              |

Workflow `.github/workflows/deploy.yml` przekazuje je do builda.

> Workflow używa `npm ci`, więc **musi istnieć `package-lock.json`** w repo.
> Uruchom lokalnie `npm install` i zacommituj `package-lock.json`.

---

## 5. Włączenie GitHub Pages

**Repo → Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

Nic więcej nie trzeba — publikacją zajmuje się `deploy.yml`.

---

## 6. Deploy

Każdy `git push` na gałąź `main` uruchamia workflow: instalacja → build →
publikacja. Strona będzie pod adresem:

```
https://adrianSACHA.github.io/skin-tracker/
```

Postęp znajdziesz w zakładce **Actions** w repo.

`HashRouter` sprawia, że odświeżenie dowolnego widoku (np.
`#/person/<id>/lesion/<id>`) działa bez dodatkowej konfiguracji 404 na Pages.

---

## Jak używać (flow)

1. Zaloguj się (jedno konto).
2. Wybierz profil: **Ja** / **Syn**.
3. **Mapa ciała** — dodaj zdjęcie tła (przód/tył/boki), potem włącz
   „+ Dodaj znamię" i klikaj miejsca na zdjęciu, aby tworzyć piny.
4. Kliknij pin → **szczegóły znamienia**:
   - dodaj kolejne zdjęcia (sesje),
   - porównaj dwa zdjęcia suwakiem przezroczystości,
   - obejrzyj trend rozmiaru (wykres) i historię ABCDE,
   - ustaw status,
   - „**Dodaj przypomnienie do kalendarza**" (Google/Apple/Outlook/.ics).
5. **Lista znamion** — statusy do obserwacji, data następnej kontroli i
   przypomnienia.

---

## Limity i budżet

- **Supabase free tier:** 500 MB baza, 1 GB Storage. Realistyczne użycie
  (kilkanaście znamion, sesje co 4–8 tygodni) mieści się w tym z dużym
  zapasem dzięki kompresji.
- **Kompresja:** `browser-image-compression` → `maxSizeMB: 0.4`,
  `maxWidthOrHeight: 1800`, `useWebWorker: true`, `fileType: 'image/webp'`.
  Orientacja EXIF obsługiwana automatycznie.
- **Hosting:** GitHub Pages — zero kosztów.
- **Przypomnienia:** generowane w przeglądarce (bez backendu) — zero kosztów.

---

## Faza 2 (planowane, po potwierdzeniu że MVP działa)

Opcjonalny pomiar wspomagany segmentacją **MediaPipe Interactive Image
Segmenter** (`@mediapipe/tasks-vision`, WASM, 100% lokalnie w przeglądarce) —
**wyłącznie geometria** (obrys → powierzchnia/średnica w mm² po kalibracji
skalą referencyjną). Model nie ocenia charakteru zmiany; ABCDE pozostaje
wypełniane ręcznie. Model i runtime ładowane z Google CDN — nie obciążają
limitów Supabase i nie wymagają zmiany hostingu.

> **Status: zaimplementowane** (`src/components/LesionSegmenter.jsx`, wpięte w
> `PhotoUploadForm` jako opcjonalny krok). Model `interactive_segmenter_v2`
> (magic touch, int8) + WASM z CDN jsdelivr, 100% w przeglądarce.
> Ustalenia z testów na `@mediapipe/tasks-vision@1.0.1`:
> - klik na znamię zamieniany jest na mały **stroke** (model nie przyjmuje
>   stroku 1-punktowego — zwracał pustą maskę),
> - **punkty negatywne** (`brushMode=2`) odwracają maskę w tym modelu, więc nie
>   są wysyłane; „− usuń z obrysu" to **lokalna gumka** stosowana przed
>   zliczeniem pikseli,
> - kalibracja: 2 kliknięcia na średnicy monety + jej średnica w mm,
> - wynik (pole mm² → równoważna średnica) trafia do `size_mm`; bez zmian
>   schematu.

---

## Rozwiązywanie problemów

| Objaw | Przyczyna / rozwiązanie |
| --- | --- |
| Biała strona na GitHub Pages, błędy 404 dla `/assets/...` | Zły `base` w `vite.config.js` — musi być `/<nazwa-repo>/`. |
| `npm ci` failuje w Actions | Brak `package-lock.json` — uruchom `npm install` i zacommituj lockfile. |
| „Brak konfiguracji Supabase" | Nie ustawiono `VITE_SUPABASE_*` (lokalnie w `.env`, w Actions w secrets). |
| Nie widać zdjęć | Bucket musi być **prywatny**, a polityki Storage z `rls-setup.sql` uruchomione. |
| Brak dostępu do profili | Sprawdź UID w `monitored_persons.owner_user_id` i polityki RLS. |
| Przycisk kalendarza się nie pojawia | Sprawdź, czy `add-to-calendar-button` jest zainstalowany (`npm install`). |
