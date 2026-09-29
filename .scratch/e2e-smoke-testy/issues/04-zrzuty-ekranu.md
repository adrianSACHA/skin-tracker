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

Bootstrapping: brakujący wzorzec Playwright **zapisuje**, a test przechodzi
(domyślne `updateSnapshots: 'missing'`). Dlatego pierwszy przebieg w CI tworzy
linuxowe wzorce i **nie czerwieni CI** — workflow wgrywa je jako artefakt
`baseline-linux` do zacommitowania. Windowsowe wzorce są w repo.

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

### Uwaga do zweryfikowania

Linuxowe wzorce **nie istnieją jeszcze w repo** — powstaną przy pierwszym
przebiegu w CI. Do tego czasu CI jest zielone (brakujący wzorzec jest zapisywany),
ale zestaw porównuje na Linuksie dopiero od momentu zacommitowania artefaktu.
