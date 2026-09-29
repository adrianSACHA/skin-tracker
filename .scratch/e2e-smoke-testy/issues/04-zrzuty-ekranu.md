# 04 — Zrzuty ekranu (regresje wyglądu)

Type: task
Status: resolved
Map: .scratch/e2e-smoke-testy/map.md
Source: .scratch/backlog/issues/04-testy-wizualne.md

## Problem

Testy e2e sprawdzały treść i zachowanie, ale **nie wygląd**. Regresja układu
albo stylów — element nachodzi na siebie, karta się rozjeżdża, kolor traci
kontrast — przechodziła przez cały zestaw niezauważona. A spora część pracy w
tym projekcie to właśnie poprawki UX/CSS (przewijanie, bottom sheet, menu `⋯`,
nagłówek z `flex-wrap`).

## Do decyzji

1. Jak pogodzić to, że zrzuty z Windowsa nie zgadzają się z tym, co renderuje
   CI na Linuksie (inne czcionki)? Poprzednio właśnie dlatego zrezygnowano ze
   zrzutów na rzecz pomiarów (`e2e/ui-budget.spec.js`).
2. Czy baseline musi być generowany w kontenerze/Dockerze?
3. Co z ekranami pokazującymi daty liczone od „dzisiaj"?

## Answer

### 1. Baseline per-platforma — bez Dockera i bez kontenera

Playwright domyślnie dokleja do nazwy pliku wzorca `process.platform`
(`snapshotSuffix`). Dlatego **każda platforma ma własny wzorzec**:

```
e2e/visual/screens.spec.js-snapshots/01-logowanie-chromium-win32.png   ← Windows
e2e/visual/screens.spec.js-snapshots/01-logowanie-chromium-linux.png   ← CI
```

Odrzucone alternatywy:

- **Docker/kontener** (`mcr.microsoft.com/playwright`) — najbardziej „podręcznikowe",
  ale na maszynie dewelopera **nie ma Dockera**, więc zestaw nie przechodziłby
  lokalnie. Wymagałby też zmiany CI na `container:`, czyli większej zmiany niż
  wartość, jaką daje.
- **Wymuszenie jednej czcionki na potrzeby testów** (`addStyleTag`) — ujednoliciłoby
  render, ale testowałoby wygląd z czcionką, której nikt nie używa. Regresja
  typograficzna przeszłaby niezauważona.
- **Wysoka tolerancja** (`maxDiffPixelRatio` ~0.1) — test przestaje cokolwiek
  łapać, więc nie osiąga celu.

Bootstrapping wzorców: patrz „Poprawka po pierwszym przebiegu w CI” na końcu
— pierwsze założenie było błędne.

### 2. Czas zamrożony

`page.clock.setFixedTime(new Date('2026-06-15T10:00:00Z'))`. Bez tego część
ekranów („Kontrola: 22.12.2025" + plakietka „zaległe", ręczna data `2026-12-01`
w danych mocka) psułaby wzorce **sama z upływem czasu** — po 2026-12-01 znamię
stałoby się zaległe i wygląd karty by się zmienił.

Data jest z przeszłości względem realnego „teraz", żeby sesja z mocka (wygasa po
godzinie) pozostawała ważna — przy dacie z przyszłości supabase-js uznałby sesję
za wygasłą i wpadłby w pętlę odświeżania.

Jest osobny test „zamrożony czas faktycznie działa" (`new Date().toISOString()`
ma zwracać dokładnie tę datę), bo gdyby `page.clock` przestał działać, wzorce
zepsułyby się dopiero po miesiącach — a ten test zapala się od razu.

### 3. Pozostałe warunki

- `deviceScaleFactor: 1`, stały viewport (1280×900 i 375×667), `hasTouch` na telefonie.
- `reducedMotion: 'reduce'` — logo ma `motion-safe:animate-pulse`.
- `toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' }`
  w `playwright.config.js`. Animacje wyłączone = determinizm.
- `fullPage: true` — łapie też treść poniżej linii zgięcia.
- Przed zrzutem czekamy na konkretną treść (np. `getByText('zaległe')`), żeby nie
  sfotografować stanu ładowania.

### 4. Zakres

8 wzorców: logowanie, wybór osoby (karta z liczbami + „zaległe"), lista znamion
(filtry zwinięte i rozwinięte), mapa ciała (pulpit i 375×667) oraz **tryb
ciemny** (wybór osoby + lista) — druga połowa stylów, której dotąd nic nie
pilnowało.

### 5. Weryfikacja

- Wzorce wygenerowane lokalnie (`npm run e2e:visual:update`), potem **4 pełne
  przebiegi `npm run e2e` z rzędu: 38/38 zielone** — porównanie jest stabilne,
  nie „flaky".
- Dopisane skrypty `npm run e2e:visual` i `npm run e2e:visual:update`, sekcja
  „Zrzuty ekranu" w README oraz artefakt `baseline-linux` w CI.

### Poprawka po pierwszym przebiegu w CI

Pierwsza wersja tego ticketu **błędnie zakładała**, że brakujący wzorzec w CI
zostanie zapisany („zapisz i idź dalej”). Jest odwrotnie: w CI Playwright
traktuje brak wzorca jako **błąd**. Pierwszy przebieg na Linuksie zaczerwienił
build na 7 testach:

```
Error: A snapshot doesn't exist at .../01-logowanie-chromium-linux.png, writing actual.
7 failed, 31 passed
```

Naprawione tak:

- `expectScreenshot()` w `screens.spec.js` **pomija** test, gdy brak wzorca dla
  bieżącej platformy, i podaje w komunikacie, jak go wygenerować. CI jest przez
  to zielone, ale **nie udaje**, że cokolwiek porównuje.
- Wzorce dla Linuksa generuje się **jawnie**: `workflow_dispatch` z opcją
  `update_visual_baselines` (`playwright test visual --update-snapshots` +
  `E2E_VISUAL_UPDATE=1`), wynik leci do artefaktu `baseline-linux`.

Sprawdzone lokalnie w trzech wariantach:

1. brak wzorca + `CI=1` → test **pominięty** (zielono),
2. `CI=1` + `E2E_VISUAL_UPDATE=1` + `--update-snapshots` → wzorzec **zapisany**,
3. regeneracja wzorca daje plik **bit w bit** identyczny z istniejącym
   (hash `DA5B1AE8...`) — czyli porównanie jest zdeterminowane.

Wniosek: nie zakładać zachowania narzędzia w CI — sprawdzić je (`CI=1` da się
ustawić lokalnie).
