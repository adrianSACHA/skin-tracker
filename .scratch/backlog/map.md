# Backlog

Effort: .scratch/backlog/
Tickets: .scratch/backlog/issues/

## Destination

**Holding area na pracę, która nie została jeszcze zaplanowana.** Wcześniej ten
backlog był rozproszony: część w `docs/STAN.md` („Otwarte / do rozważenia”),
część tylko w rozmowie — i przez to wracał przy każdej sesji od zera.

Zasada tego katalogu: **ticket istnieje tu tylko wtedy, gdy wiemy, co ma być
zrobione.** Każdy ma `Status:` z `docs/agents/triage-labels.md`. Gdy temat
zostaje podjęty, ticket przenosi się do własnego effortu (albo tu dostaje
`Status: resolved` i `## Answer`).

## Decisions so far

- **Multi-device Web Push — zrobione, nie wracać.** `enablePush()` zapisuje
  subskrypcję przez `upsert(..., { onConflict: 'endpoint' })`, `disablePush()`
  kasuje po `endpoint`, a `scripts/send-reminders.mjs` wysyła do **wszystkich**
  subskrypcji właściciela i sam usuwa wygasłe (`404`/`410`).
- **Treść powiadomień — zrobione, nie wracać.** `send-reminders.mjs` już
  agreguje: jedno znamię → z nazwą i terminem, kilka → „N kontroli do wykonania
  — X zaległych”.
- **Testy e2e — zrobione** (`.scratch/e2e-smoke-testy/`, 18 testów). Kolejne
  pomysły testowe wpisujemy jako rozszerzenia tam, nie tutaj.
- **Refaktor zwijanych paneli — `wontfix`** (ticket 06). Świadomie odrzucony.
- **Ticket 02 zrobiony (2026-09-28).** Nowy szew `dueRows()` w
  `src/lib/lesionView.js` (bez zmian w `buildRows`) użyty w znaczniku
  „Kontrole”, liście Kontroli, karcie osoby i skrypcie Web Push.
  Szczegóły: `issues/02-usuniete-nie-jest-zalegle.md`.
- **Tickety 03 i 07 zrobione (2026-09-28).** 03: szukanie w Kontrolach
  (stan w adresie, wspólny `filterByQuery`), bez sortowania — świadomie.
  07: sygnał `notifyDueChanged()` + przeliczanie przy zmianie ekranu i
  powrocie do aplikacji. Szczegóły: `issues/03-*.md`, `issues/07-*.md`.
- **Znaleziony przy 03 i naprawiony:** `OverflowMenu` nie pilnował pionu,
  więc dolne pozycje menu w Kontrolach były nieosiągalne.
- **Ticket 08 zrobiony (2026-09-29).** Nagłówek na 375×667: 286 → 121 px
  (baner instalacji na dół, „Zainstaluj” jako ikona, panel przypomnień
  zwinięty domyślnie). Zabezpieczone budżetem `e2e/ui-budget.spec.js`.
  Szczegóły i pomiary: `issues/08-kompresja-naglowka.md`.
- **Ticket 09 dodany (2026-09-29).** Decyzja o nawigacji na telefonie
  odłożona świadomie — najpierw zobaczyć efekt odchudzenia nagłówka.
- **Tickety 10 i 11 dodane (2026-09-29).** 10: przegląd wszystkich ekranów na
  375×667 — za małe cele dotykowe (najgorsze: piny 20 px, suwak porównania
  8 px). 11: wysyłka przypomnień nie mówi wprost, czy coś poszła, i nie ma
  trybu testowego. **Decyzja: raz dziennie wystarczy** — częstotliwości nie
  zmieniamy.
- **Naprawione przy przeglądzie (2026-09-29):** mapa połykała gest przewijania
  przy skali 1 (nie dało się przewinąć strony, łapiąc za zdjęcie); strzałki
  nawigacyjne zamienione na `<` / `>`.
- **Ticket 11 zrobiony (2026-09-29).** Logika przypomnień w jednym miejscu
  (`src/lib/reminders.js`, testowana), podsumowanie przebiegu widoczne na
  stronie runu, tryb próbny `force` (nie zużywa cyklu). Przy weryfikacji
  złapany błąd: brak rozszerzeń `.js` w importach → skrypt wywalał się po
  uruchomieniem przez Node. Szczegóły: `issues/11-wysylka-diagnostyka.md`.

- **Ticket 04 zrobiony (2026-09-29)** — zrzuty ekranu. Przeniesiony do
  effortu testów (`.scratch/e2e-smoke-testy/issues/04-zrzuty-ekranu.md`):
  baseline per-platforma (Windows/Linux, bez Dockera), zamrożony czas,
  8 wzorców. Przy okazji naprawiony niestabilny test gestu zoomu
  (ticket 05 tego effortu) — `zoomIn()` mnożył od bieżącej skali, a test
  asertował dokładne `scale(1.5`.

## Not yet specified (mgła)

- Import danych (odtworzenie kopii zapasowej na nowym projekcie). Zależy od
  tego, jaki format wybierzemy w tickecie 01.
- Kopia zapasowa po stronie GitHuba (workflow cyklicznie zrzucający dump) —
  sensowne dopiero, gdy będzie ustalony format.
- Progi na darmowym tierze Supabase (500 MB baza / 1 GB Storage) — czy chcemy
  licznik użycia w UI, czy to przesada przy jednym koncie.

## Out of scope

- Pomysły bez zdefiniowanego celu („zrobić ładniej”).
- Wszystko, co już działa (patrz Decisions so far).

## Tickets

| #  | Type | Tytuł | Status |
| -- | ---- | ----- | ------ |
| 01 | task | [Eksport / kopia zapasowa danych](issues/01-eksport-kopia-zapasowa.md) | needs-triage |
| 02 | task | [Znamiona „Usunięte” wciąż liczą się jako zaległe](issues/02-usuniete-nie-jest-zalegle.md) | resolved |
| 03 | task | [Wyszukiwanie i sortowanie w Kontrolach](issues/03-szukanie-w-kontrolach.md) | resolved |
| 04 | task | [Testy wizualne w e2e](issues/04-testy-wizualne.md) | ready-for-agent |
| 05 | task | [Audyt dostępności (a11y)](issues/05-audyt-a11y.md) | needs-triage |
| 06 | task | [Wspólny wzorzec zwijanych paneli](issues/06-wspolny-zwijany-wzorzec.md) | wontfix |
| 07 | task | [Znacznik przy „Kontrole” nie odświeżał się po zmianie danych](issues/07-znacznik-nie-odswieza-sie.md) | resolved |
| 08 | task | [Nagłówek na telefonie zjadał 43% ekranu](issues/08-kompresja-naglowka.md) | resolved |
| 09 | task | [Nawigacja na telefonie: zostawić, dolny pasek czy hamburger](issues/09-nawigacja-mobile.md) | needs-triage |
| 10 | task | [Za małe cele dotykowe (piny, suwak, linki)](issues/10-cele-dotykowe.md) | needs-triage |
| 11 | task | [Wysyłka przypomnień: nie widać, czy coś poszło](issues/11-wysylka-diagnostyka.md) | resolved |

## Frontier

Do wzięcia bez decyzji: **04** (`ready-for-agent`).
Wymagają Twojej decyzji: **01** (format i zakres eksportu), **05** (zakres
audytu), **09** (nawigacja na telefonie), **10** (które cele dotykowe
naprawiamy i w jakiej kolejności).
Zrobione: **02**, **03**, **07**, **08** (`resolved`). Odrzucone: **06** (`wontfix`).
